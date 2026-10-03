#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_system.h>
#include "arduino_secrets.h"

const int sensorPins[] = {39, 34, 35, 32, 33};
const size_t sensorCount = sizeof(sensorPins) / sizeof(sensorPins[0]);
const unsigned long uploadIntervalMs = 300000;
const unsigned long wifiConnectTimeoutMs = 30000;

String maskValue(const char* value) {
  size_t length = strlen(value);

  if (length <= 4) {
    return "****";
  }

  String masked = "****";
  masked += String(value + length - 4);
  return masked;
}

bool connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long wifiConnectStartedAt = millis();

  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - wifiConnectStartedAt >= wifiConnectTimeoutMs) {
      Serial.printf("WiFi connection failed. Status code: %d\n", WiFi.status());
      Serial.println("Check SSID, password, and 2.4 GHz network availability.");
      return false;
    }

    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.printf("WiFi connected. IP: %s, RSSI: %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  return true;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  delay(1000);

  Serial.println("Starting EarthSense ESP32...");
  Serial.printf("WiFi SSID: %s\n", WIFI_SSID);
  Serial.printf("WiFi password: configured (%u characters)\n", strlen(WIFI_PASSWORD));
  Serial.printf("API endpoint: %s\n", API_ENDPOINT);
  Serial.printf("Device ID: %s\n", maskValue(DEVICE_ID).c_str());
  Serial.printf("Device key: configured (%u characters, %s)\n", strlen(DEVICE_KEY), maskValue(DEVICE_KEY).c_str());
  Serial.printf("Configured sensors: %u\n", sensorCount);
  Serial.printf("Upload interval: %lu ms\n", uploadIntervalMs);

  connectToWiFi();
}

float adcToHumidity(int rawValue) {
  float pct = map(rawValue, 3100, 700, 0, 10000) / 100.0f;
  return constrain(pct, 0.0f, 100.0f);
}

String createBatchId() {
  uint32_t randomA = esp_random();
  uint32_t randomB = esp_random();
  uint32_t randomC = esp_random();
  uint32_t randomD = esp_random();
  char batchId[37];

  snprintf(
    batchId,
    sizeof(batchId),
    "%08lx-%04x-%04x-%04x-%04x%08lx",
    static_cast<unsigned long>(randomA),
    static_cast<unsigned int>(randomB >> 16),
    static_cast<unsigned int>((randomB & 0x0fff) | 0x4000),
    static_cast<unsigned int>((randomC >> 16 & 0x3fff) | 0x8000),
    static_cast<unsigned int>(randomC & 0xffff),
    static_cast<unsigned long>(randomD)
  );

  return String(batchId);
}

bool sendReadings(const int rawValues[], const float humidities[], const String& batchId) {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    return false;
  }

  HTTPClient http;
  http.setTimeout(15000);

  if (!http.begin(API_ENDPOINT)) {
    Serial.println("HTTP Error: unable to initialize connection.");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  StaticJsonDocument<1024> doc;
  doc["device_id"] = DEVICE_ID;
  doc["batch_id"] = batchId;
  JsonArray readings = doc.createNestedArray("readings");

  for (size_t i = 0; i < sensorCount; i++) {
    JsonObject reading = readings.createNestedObject();
    reading["sensor_index"] = i + 1;
    reading["humidity_pct"] = humidities[i];
    reading["raw_value"] = rawValues[i];
  }

  String body;
  serializeJson(doc, body);
  int httpCode = http.POST(body);
  Serial.printf("Batch HTTP Response: %d\n", httpCode);

  if (httpCode > 0 && httpCode >= 400) {
    Serial.printf("API Response: %s\n", http.getString().c_str());
    Serial.println("Delaying 30 seconds till next request.");
    delay(30000);
  }

  if (httpCode < 0) {
    Serial.printf("HTTP Error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();

  return httpCode >= 200 && httpCode < 300;
}

void loop() {
  int rawValues[sensorCount];
  float humidities[sensorCount];

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi is not connected. Skipping upload cycle.");
    connectToWiFi();
    delay(5000);
    return;
  }

  for (size_t i = 0; i < sensorCount; i++) {
    rawValues[i] = analogRead(sensorPins[i]);
    humidities[i] = adcToHumidity(rawValues[i]);

    Serial.printf(
      "Sensor %d (Pin %d): Raw = %d, Humidity = %.2f%%\n",
      i + 1,
      sensorPins[i],
      rawValues[i],
      humidities[i]
    );
  }

  String batchId = createBatchId();
  for (int attempt = 1; attempt <= 3; attempt++) {
    if (sendReadings(rawValues, humidities, batchId)) {
      break;
    }

    Serial.printf("Upload attempt %d failed.\n", attempt);
    delay(2000 * attempt);
  }

  Serial.println("-----------------------------------");
  delay(uploadIntervalMs);
}