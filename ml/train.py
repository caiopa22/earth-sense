"""Trains and evaluates the EarthSense soil moisture forecast model (t + 30 min).

Usage:
    python ml/train.py ml/data/soil_readings.csv

Outputs:
    ml/output/metrics.json               persistence, Ridge and RandomForest metrics
    ml/output/actual_vs_predicted.png    actual vs predicted series on the test set
    backend/src/ml/model.json            exported Ridge model (scaling + coefficients)
    backend/src/ml/parity.fixture.json   20 real samples for the TS x Python parity test
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from sklearn.ensemble import RandomForestRegressor  # noqa: E402
from sklearn.linear_model import Ridge  # noqa: E402
from sklearn.metrics import mean_absolute_error, mean_squared_error  # noqa: E402
from sklearn.preprocessing import StandardScaler  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

WINDOW = 4  # readings used as input
HORIZON_MIN = 30  # forecast 30 min ahead (6 readings at 5 min)
TARGET_TOLERANCE_MIN = 3  # target accepted at t + 30 min ± 3 min
MAX_GAP_MIN = 10  # max gap between consecutive readings in the window
TEST_FRACTION = 0.2
RANDOM_STATE = 42

# Same thresholds as backend/src/utils/soil.ts
BANDS = [(20, "dry"), (40, "low"), (70, "optimal"), (85, "high")]


def classify_soil(humidity: float) -> str:
    for limit, name in BANDS:
        if humidity < limit:
            return name
    return "saturated"


def build_features(values: np.ndarray, sensor_index: int, sensors: list[int]) -> list[float]:
    """values: the 4 window readings in time order (oldest -> newest)."""
    diffs = np.diff(values)
    one_hot = [1.0 if sensor_index == s else 0.0 for s in sensors]
    return [*values, *diffs, float(np.mean(values)), float(np.std(values)), *one_hot]


def feature_names(sensors: list[int]) -> list[str]:
    lags = [f"lag_{WINDOW - 1 - i}" for i in range(WINDOW)]  # lag_3 ... lag_0 (current)
    diffs = [f"diff_{i + 1}" for i in range(WINDOW - 1)]
    return [*lags, *diffs, "mean", "std", *[f"sensor_{s}" for s in sensors]]


def load_readings(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    # sampled_at is the collection time; falls back to created_at when the firmware does not send it.
    sampled = pd.to_datetime(df["sampled_at"], format="ISO8601", utc=True, errors="coerce")
    created = pd.to_datetime(df["created_at"], format="ISO8601", utc=True)
    df["t"] = sampled.astype(created.dtype).fillna(created)
    df["humidity_pct"] = df["humidity_pct"].astype(float)
    df = df.drop_duplicates(subset=["device_id", "sensor_index", "t"])
    return df.sort_values(["device_id", "sensor_index", "t"]).reset_index(drop=True)


def build_samples(df: pd.DataFrame, sensors: list[int]) -> pd.DataFrame:
    rows = []
    horizon = pd.Timedelta(minutes=HORIZON_MIN)
    tolerance = pd.Timedelta(minutes=TARGET_TOLERANCE_MIN)
    max_gap = pd.Timedelta(minutes=MAX_GAP_MIN)

    for (device_id, sensor), g in df.groupby(["device_id", "sensor_index"]):
        times = g["t"].to_numpy()
        values = g["humidity_pct"].to_numpy()
        for i in range(WINDOW - 1, len(g)):
            window_t = pd.to_datetime(times[i - WINDOW + 1 : i + 1], utc=True)
            if (window_t[1:] - window_t[:-1]).max() > max_gap:
                continue
            t_now = window_t[-1]
            # target: same-sensor reading closest to t + 30 min, within ± 3 min
            future = pd.to_datetime(times[i + 1 :], utc=True)
            if len(future) == 0:
                continue
            delta = np.abs((future - (t_now + horizon)).total_seconds())
            j = int(np.argmin(delta))
            if delta[j] > tolerance.total_seconds():
                continue
            window_v = values[i - WINDOW + 1 : i + 1]
            rows.append(
                {
                    "device_id": device_id,
                    "sensor_index": int(sensor),
                    "t": t_now,
                    "t_target": future[j],
                    "window": [float(v) for v in window_v],
                    "features": build_features(window_v, int(sensor), sensors),
                    "y": float(values[i + 1 + j]),
                }
            )
    return pd.DataFrame(rows)


def chronological_split(samples: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Chronological 80/20 split per sensor, no shuffling.

    Training samples whose target falls inside the test period are dropped,
    so no test value is seen during training.
    """
    train_parts, test_parts = [], []
    for _, g in samples.groupby(["device_id", "sensor_index"]):
        g = g.sort_values("t")
        cut = int(round(len(g) * (1 - TEST_FRACTION)))
        train, test = g.iloc[:cut], g.iloc[cut:]
        if len(test) > 0:
            train = train[train["t_target"] < test["t"].iloc[0]]
        train_parts.append(train)
        test_parts.append(test)
    return pd.concat(train_parts), pd.concat(test_parts)


def clip(pred: np.ndarray) -> np.ndarray:
    return np.clip(pred, 0.0, 100.0)


def evaluate(y: np.ndarray, pred: np.ndarray) -> dict:
    bands_true = [classify_soil(v) for v in y]
    bands_pred = [classify_soil(v) for v in pred]
    return {
        "n": int(len(y)),
        "mae": round(float(mean_absolute_error(y, pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y, pred))), 4),
        "band_hit_rate": round(float(np.mean([a == b for a, b in zip(bands_true, bands_pred)])), 4),
    }


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # correct output encoding on the Windows terminal
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "csv",
        type=Path,
        nargs="?",
        default=Path("ml/data/soil_readings.csv"),
        help="CSV export of the Supabase soil_readings table (default: ml/data/soil_readings.csv)",
    )
    parser.add_argument("--out-dir", type=Path, default=ROOT / "ml" / "output")
    parser.add_argument("--model-out", type=Path, default=ROOT / "backend" / "src" / "ml" / "model.json")
    parser.add_argument(
        "--fixture-out", type=Path, default=ROOT / "backend" / "src" / "ml" / "parity.fixture.json"
    )
    args = parser.parse_args()

    df = load_readings(args.csv)
    sensors = sorted(int(s) for s in df["sensor_index"].unique())
    samples = build_samples(df, sensors)
    if samples.empty:
        raise SystemExit("No samples with a t + 30 min target found in the CSV.")

    train, test = chronological_split(samples)
    X_train = np.array(train["features"].tolist())
    X_test = np.array(test["features"].tolist())
    y_train = train["y"].to_numpy()
    y_test = test["y"].to_numpy()

    # Ridge with default parameters (alpha=1.0) on standardized features.
    scaler = StandardScaler().fit(X_train)
    ridge = Ridge().fit(scaler.transform(X_train), y_train)
    rf = RandomForestRegressor(random_state=RANDOM_STATE).fit(X_train, y_train)

    preds = {
        "persistence": clip(np.array([w[-1] for w in test["window"]])),
        "ridge": clip(ridge.predict(scaler.transform(X_test))),
        "random_forest": clip(rf.predict(X_test)),
    }

    sensor_test = test["sensor_index"].to_numpy()
    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source_csv": args.csv.as_posix(),
        "config": {
            "window": WINDOW,
            "horizon_min": HORIZON_MIN,
            "target_tolerance_min": TARGET_TOLERANCE_MIN,
            "max_gap_min": MAX_GAP_MIN,
            "test_fraction": TEST_FRACTION,
            "split": "chronological per sensor, no shuffling",
            "ridge": "Ridge(alpha=1.0) + StandardScaler, default parameters",
            "random_forest": f"RandomForestRegressor(random_state={RANDOM_STATE}), default parameters",
        },
        "dataset": {
            "readings": int(len(df)),
            "samples": int(len(samples)),
            "train_samples": int(len(train)),
            "test_samples": int(len(test)),
            "test_period": [test["t"].min().isoformat(), test["t"].max().isoformat()],
        },
        "models": {},
    }
    for name, pred in preds.items():
        per_sensor = {
            str(s): evaluate(y_test[sensor_test == s], pred[sensor_test == s])
            for s in sensors
            if (sensor_test == s).any()
        }
        metrics["models"][name] = {"overall": evaluate(y_test, pred), "per_sensor": per_sensor}

    args.out_dir.mkdir(parents=True, exist_ok=True)
    (args.out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Actual vs predicted figure on the test set
    fig, axes = plt.subplots(len(sensors), 1, figsize=(11, 2.4 * len(sensors)), sharex=True)
    axes = np.atleast_1d(axes)
    styles = {"persistence": ("Persistence", ":"), "ridge": ("Ridge", "-"), "random_forest": ("RandomForest", "--")}
    for ax, s in zip(axes, sensors):
        mask = sensor_test == s
        t_target = pd.to_datetime(test["t_target"].to_numpy()[mask], utc=True)
        ax.plot(t_target, y_test[mask], color="black", linewidth=2, label="Actual")
        for name, (label, ls) in styles.items():
            ax.plot(t_target, preds[name][mask], linestyle=ls, label=label)
        ax.set_ylabel(f"S{s} (%)")
        ax.grid(alpha=0.3)
    axes[0].legend(loc="upper right", ncol=4, fontsize=8)
    axes[0].set_title("Actual vs predicted soil moisture (t + 30 min) — test set")
    axes[-1].set_xlabel("Target time (UTC)")
    fig.tight_layout()
    fig.savefig(args.out_dir / "actual_vs_predicted.png", dpi=150)

    # Export Ridge for TypeScript inference
    model = {
        "type": "ridge",
        "trained_at": metrics["generated_at"],
        "window": WINDOW,
        "horizon_min": HORIZON_MIN,
        "max_gap_min": MAX_GAP_MIN,
        "sensors": sensors,
        "feature_names": feature_names(sensors),
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "coef": ridge.coef_.tolist(),
        "intercept": float(ridge.intercept_),
        "train_samples": int(len(train)),
        "metrics": {
            "ridge": metrics["models"]["ridge"],
            "persistence": metrics["models"]["persistence"],
        },
    }
    args.model_out.parent.mkdir(parents=True, exist_ok=True)
    args.model_out.write_text(json.dumps(model, indent=2) + "\n", encoding="utf-8")

    # 20 real test samples for the TS x Python parity test
    idx = np.linspace(0, len(test) - 1, num=min(20, len(test)), dtype=int)
    fixture = [
        {
            "sensor_index": int(test["sensor_index"].iloc[i]),
            "window": test["window"].iloc[i],
            "expected": float(preds["ridge"][i]),
        }
        for i in idx
    ]
    args.fixture_out.write_text(json.dumps(fixture, indent=2) + "\n", encoding="utf-8")

    # Final table
    labels = {"persistence": "Persistence", "ridge": "Ridge", "random_forest": "RandomForest"}
    print(f"\nSamples: {len(train)} train / {len(test)} test  (target: t + {HORIZON_MIN} min)\n")
    header = f"{'Model':<14}{'Sensor':>8}{'n':>6}{'MAE':>9}{'RMSE':>9}{'Band hit':>14}"
    print(header)
    print("-" * len(header))
    for name, m in metrics["models"].items():
        rows = [("all", m["overall"])] + [(f"S{s}", v) for s, v in m["per_sensor"].items()]
        for sensor_label, v in rows:
            print(
                f"{labels[name]:<14}{sensor_label:>8}{v['n']:>6}{v['mae']:>9.3f}{v['rmse']:>9.3f}"
                f"{v['band_hit_rate'] * 100:>13.1f}%"
            )
        print("-" * len(header))
    print(f"\nmetrics.json -> {args.out_dir / 'metrics.json'}")
    print(f"model.json   -> {args.model_out}")


if __name__ == "__main__":
    main()
