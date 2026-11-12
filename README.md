# 🌍 EarthSense

> **Monitoramento de Umidade do Solo utilizando IoT, Aprendizado de Máquina e Dashboard Web**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/backend-Node.js-339933?logo=nodedotjs&logoColor=white)
![ESP32](https://img.shields.io/badge/hardware-ESP32-E7352C?logo=espressif&logoColor=white)
![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E?logo=scikitlearn&logoColor=white)

A plataforma **EarthSense** é um sistema integrado focado no monitoramento em tempo real e de baixo custo da umidade do solo para agricultura de precisão. O projeto une hardware embarcado (ESP32), uma API robusta, um Dashboard interativo e um modelo de previsão de umidade treinado com os dados do próprio protótipo para auxiliar pequenos e médios produtores rurais na gestão inteligente da irrigação.

---

## ✨ Principais Funcionalidades

- 📡 **Coleta via IoT:** Hardware embarcado (ESP32) coleta dados de múltiplos sensores capacitivos de umidade e transmite em lotes via Wi-Fi.
- 🧠 **Previsão a 30 min (ML):** Modelo de regressão Ridge, treinado em Python (scikit-learn) com as leituras do projeto, prevê a umidade de cada sensor 30 minutos à frente. A inferência roda em TypeScript no backend, sem Python em produção.
- 📊 **Dashboard em Tempo Real:** Interface web responsiva em React para visualização de leituras, gráficos históricos e dados dos dispositivos.
- 🗄️ **Armazenamento Seguro:** Banco de dados relacional (PostgreSQL via Supabase) com autenticação e políticas de segurança por nível de linha (RLS).

---

## 🏗️ Arquitetura do Projeto

O repositório está organizado em monorepo, separando responsabilidades lógicas do sistema de forma clara:

```text
earth-sense/
├── arduino-code/       # 💻 Firmware C/C++ para o ESP32 (arduino-code.ino + arduino_secrets.h)
├── backend/            # ⚙️ API RESTful (Node.js + Express + TypeScript)
│   ├── supabase/
│   │   └── migrations/ # Schema do banco (tabelas, RLS e permissões)
│   ├── src/
│   │   ├── routes/     # Endpoints (auth, dispositivos, leituras, previsão)
│   │   ├── ml/         # Inferência do modelo (forecast.ts) e model.json exportado
│   │   └── utils/      # Utilitários (inclui classificação de faixas de umidade)
│   └── package.json
├── frontend/           # 🎨 Dashboard Web (React + React Router + Vite)
│   ├── app/
│   │   ├── routes/     # Telas da aplicação (Dashboard, Histórico, Auth)
│   │   ├── components/ # Componentes reutilizáveis de UI
│   │   └── lib/        # Integração com API e utilitários
│   └── package.json
├── ml/                 # 🧪 Treino e avaliação do modelo (Python + scikit-learn)
│   ├── train.py        # Treina, avalia e exporta o modelo
│   └── output/         # metrics.json e figura real x previsto
├── docs/               # 📚 Documentação do projeto (TCC, Arquitetura)
│   ├── TCC.txt         # Documento do Trabalho de Conclusão de Curso
│   └── arquitetura...  # Guias de modelagem e arquitetura
├── insomnia/           # 🛠️ Testes de API
│   └── earthsense-api.insomnia.json # Collection exportada para importação
└── package.json        # 📦 Scripts root para rodar backend e frontend
```

---

## 🛠️ Tecnologias Utilizadas

### Hardware (Camada IoT)
- **Microcontrolador:** ESP32 (Wi-Fi Nativo, Dual-Core)
- **Sensores:** Capacitivos de Umidade do Solo v1.2

### Software e Web
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js, Express, TypeScript
- **Banco de Dados:** PostgreSQL (via plataforma Supabase)
- **Aprendizado de Máquina:** Python, scikit-learn (treino); TypeScript (inferência)

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) **v22.22 ou superior** (exigido pelo React Router 8, Vite e Vitest).
- Conta e projeto criados no [Supabase](https://supabase.com/).
- [Arduino IDE](https://www.arduino.cc/en/software) com o pacote de placas **esp32** (Espressif) e a biblioteca **ArduinoJson** (apenas para gravar o firmware).
- Python 3.10+ (apenas para treinar o modelo).

### 2. Variáveis de Ambiente
Copie os arquivos de exemplo e preencha com os dados do seu projeto Supabase:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

| Variável | Onde encontrar |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → chave `service_role` (nunca exponha no frontend) |
| `PORT` | Porta da API (padrão `3000`) |

**`frontend/.env`**

| Variável | Valor |
|---|---|
| `VITE_API_URL` | URL da API, por padrão `http://localhost:3000/api` |

### 3. Banco de Dados (migrations)
O schema completo (tabelas `profiles`, `devices` e `soil_readings`, políticas RLS e permissões) está em `backend/supabase/migrations/`. Para aplicá-lo no seu projeto Supabase, pegue a connection string em **Supabase → Connect → Session pooler** (substitua `[YOUR-PASSWORD]` pela senha do banco) e rode, a partir da raiz:

```bash
cd backend
npx supabase db push --db-url "postgresql://postgres.<project-ref>:<senha>@aws-0-<regiao>.pooler.supabase.com:5432/postgres"
```

O comando aplica, em ordem, apenas as migrations que ainda não rodaram naquele banco, então pode ser executado de novo sempre que surgir uma migration nova.

### 4. Instalação e Execução
Na raiz do projeto (onde este README está localizado), execute:

```bash
# 1. Instale todas as dependências (root, frontend e backend)
npm ci

# 2. Inicie os servidores de desenvolvimento
npm run dev
```

A aplicação estará disponível em:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000

### 5. Executando com Docker (alternativa)
Com o [Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto e o arquivo `backend/.env` preenchido, na raiz do projeto execute:

```bash
docker compose up --build -d
```

O frontend fica em http://localhost:5173 e o backend em http://localhost:3000. Não é necessário ter o Node.js instalado. O banco (Supabase) continua na nuvem, então é preciso conexão com a internet.

Para parar: `docker compose down`. Para ver os logs: `docker compose logs -f`.

### 6. Configurando o ESP32
O firmware fica em `arduino-code/` e lê 5 sensores capacitivos (GPIOs 39, 34, 35, 32 e 33), enviando um lote com todas as leituras a cada 5 minutos para a API.

1. **Cadastre o dispositivo** no dashboard (página Dispositivos) com o mesmo número de sensores ligados ao ESP32 (5 no firmware atual). Anote o `id` do dispositivo.
2. **Gere a chave do dispositivo** com o request `Devices - Provision Device Key` do Insomnia (`POST /api/devices/:id/device-key`, autenticado com o token do usuário). A resposta traz o campo `device_key`, que **só é mostrado uma vez**; gerar uma nova chave invalida a anterior.
3. **Crie o arquivo de credenciais** a partir do exemplo:
   ```bash
   cp arduino-code/arduino_secrets.example.h arduino-code/arduino_secrets.h
   ```
   e preencha:

   | Constante | Valor |
   |---|---|
   | `WIFI_SSID` / `WIFI_PASSWORD` | Rede Wi-Fi **2,4 GHz** (o ESP32 não conecta em 5 GHz) |
   | `API_ENDPOINT` | `http://<IP-do-computador-na-rede>:3000/api/soil-readings/batch` |
   | `DEVICE_ID` | `id` do dispositivo cadastrado no passo 1 |
   | `DEVICE_KEY` | `device_key` gerada no passo 2 |

   O `arduino_secrets.h` está no `.gitignore` e não deve ser commitado.
4. **Grave o firmware**: abra `arduino-code/arduino-code.ino` na Arduino IDE, selecione a placa **ESP32 Dev Module** e a porta, e faça o upload.
5. **Confira no Serial Monitor** (115200 baud): o ESP32 mostra o IP obtido, o endpoint configurado e a resposta da API a cada envio (`201` indica lote gravado).

> Se o ESP32 não conseguir enviar, verifique se o computador e o ESP32 estão na mesma rede e libere a porta 3000 no Firewall do Windows. Uma resposta `401` indica chave inválida ou revogada; `400` indica que o número de sensores enviados é diferente do cadastrado no dispositivo.

### 7. Testando a API
Você pode importar o arquivo `insomnia/earthsense-api.insomnia.json` no cliente **Insomnia** para testar as rotas de ingestão de dados e a rota de previsão (`ML - Forecast 30 min`). As rotas de usuário usam o header `Authorization: Bearer <token>` (obtido no login); a rota de lote do ESP32 (`Readings - Create IoT Batch`) usa o header `X-Device-Key`.

### 8. Testes automatizados

```bash
npm test --workspace backend   # inclui o teste de paridade TypeScript x Python
```

---

## 🧪 Previsão de Umidade (Machine Learning)

### O problema
Para cada leitura de um sensor no instante *t*, prever a umidade do **mesmo sensor em t + 30 min** (6 leituras de 5 min). O alvo é a leitura mais próxima de t + 30 min, com tolerância de ±3 min; amostras sem alvo são descartadas.

### Features
- As 4 leituras mais recentes do sensor até *t*, em ordem temporal (a janela é descartada se houver intervalo maior que 10 min entre duas leituras);
- as 3 diferenças entre leituras consecutivas, a média e o desvio padrão da janela;
- o índice do sensor em one-hot.

O instante de cada leitura é `sampled_at`; quando o firmware não envia esse campo, usa-se `created_at`.

### Avaliação
- Split **cronológico 80/20 por sensor**, sem embaralhar. Amostras de treino cujo alvo cai dentro do período de teste são descartadas.
- Modelos com **parâmetros padrão**, sem ajuste olhando o teste: `Ridge(alpha=1.0)` com `StandardScaler` e `RandomForestRegressor(random_state=42)`.
- Baseline de **persistência**: repetir o último valor lido.
- Métricas: MAE, RMSE (em pontos percentuais de umidade) e taxa de acerto da faixa (seco <20, baixa 20–<40, ótima 40–<70, alta 70–<85, saturado ≥85).

### Resultados (conjunto de teste, 240 amostras)

| Modelo | MAE | RMSE | Acerto da faixa |
|---|---:|---:|---:|
| Persistência | 4,77 | 7,20 | 79,6% |
| Ridge | 5,41 | 7,89 | 77,5% |
| RandomForest | 5,10 | 7,18 | 85,4% |

Por sensor (MAE):

| Modelo | S1 | S2 | S3 | S4 | S5 |
|---|---:|---:|---:|---:|---:|
| Persistência | 2,09 | 0,82 | 5,29 | 6,57 | 9,10 |
| Ridge | 1,60 | 0,87 | 6,58 | 6,99 | 10,99 |
| RandomForest | 2,08 | 2,42 | 7,87 | 6,64 | 6,51 |

**Leitura honesta dos números:** no MAE geral, o baseline de persistência foi melhor que os dois modelos. O Ridge só supera a persistência no sensor S1; o RandomForest tem o maior acerto de faixa e o menor MAE no sensor S5 (e RMSE geral praticamente igual ao da persistência), mas erra mais em S2 e S3. A base é pequena: 1300 leituras de um único dispositivo, quase todas em uma janela contínua de ~21 h (27–28/09/2026), e o teste cobre cerca de 4 h. Os números completos estão em `ml/output/metrics.json` e a figura em `ml/output/actual_vs_predicted.png`.

O modelo em produção é o **Ridge**, por ser o melhor modelo linear e poder ser exportado como coeficientes, o que permite inferência em TypeScript sem Python no servidor. O dashboard mostra, para cada sensor, o valor previsto, a faixa prevista e o erro médio (MAE) do Ridge naquele sensor.

### Como treinar e exportar

```bash
pip install -r ml/requirements.txt
python ml/train.py ml/data/soil_readings.csv
```

O CSV é o export da tabela `soil_readings` do Supabase (Table Editor → Export to CSV). O script imprime a tabela de métricas no terminal e gera:

- `ml/output/metrics.json` — MAE, RMSE e acerto da faixa por modelo e por sensor;
- `ml/output/actual_vs_predicted.png` — série real x prevista no conjunto de teste;
- `backend/src/ml/model.json` — Ridge exportado (médias e escalas da normalização, coeficientes e intercepto);
- `backend/src/ml/parity.fixture.json` — 20 amostras reais usadas no teste de paridade TypeScript x Python (tolerância 1e-6).

Depois de retreinar, rode `npm test --workspace backend` e reinicie o backend para carregar o novo `model.json`.

### Endpoint

`GET /api/ml/forecast/:deviceId` (autenticado). Para cada sensor do dispositivo, lê as leituras mais recentes ordenadas pelo instante de coleta, aplica o modelo e devolve o valor previsto, a faixa prevista, o horário-alvo e as métricas do Ridge. Sensores sem 4 leituras consecutivas vêm com `status: "insufficient_data"`; se nenhum sensor tiver dados suficientes, a resposta é **422**.

---

## 🎓 Sobre o Projeto Acadêmico
O EarthSense foi desenvolvido como Trabalho de Conclusão de Curso (TCC) do curso de Ciência da Computação da Universidade Paulista (UNIP) por:
- Brian Borges Santos Silva
- Caio Pacheco Andrade
- Fabricio Da Silva Roza Garcia
- Vitor De Souza Botelho

Orientador: Prof. Marco Gomes
