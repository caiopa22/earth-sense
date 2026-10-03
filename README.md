# 🌍 EarthSense

> **Monitoramento de Umidade do Solo utilizando IoT, Inteligência Artificial e Dashboard Web**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/backend-Node.js-339933?logo=nodedotjs&logoColor=white)
![ESP32](https://img.shields.io/badge/hardware-ESP32-E7352C?logo=espressif&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75B2?logo=googlegemini&logoColor=white)

A plataforma **EarthSense** é um sistema integrado focado no monitoramento em tempo real e de baixo custo da umidade do solo para agricultura de precisão. O projeto une hardware embarcado (ESP32), uma API robusta, um Dashboard interativo e o poder da Inteligência Artificial (Earth Agent, via Google Gemini) para auxiliar pequenos e médios produtores rurais na gestão inteligente da irrigação.

---

## ✨ Principais Funcionalidades

- 📡 **Coleta via IoT:** Hardware embarcado (ESP32) coleta dados de múltiplos sensores capacitivos de umidade e transmite em lotes via Wi-Fi.
- 🧠 **Earth Agent (IA):** Integração com o Google Gemini (LLM) que interpreta as séries temporais, classifica o estado do solo e gera recomendações de manejo hídrico.
- 📊 **Dashboard em Tempo Real:** Interface web responsiva em React para visualização de leituras, gráficos históricos e dados dos dispositivos.
- 🗄️ **Armazenamento Seguro:** Banco de dados relacional (PostgreSQL via Supabase) com autenticação e políticas de segurança por nível de linha (RLS).
- 🚀 **Automação (CI/CD):** Deploy contínuo da aplicação e fácil replicação do ambiente de desenvolvimento.

---

## 🏗️ Arquitetura do Projeto

O repositório está organizado em monorepo, separando responsabilidades lógicas do sistema de forma clara:

```text
earth-sense/
├── arduino-code/       # 💻 Firmware C/C++ para o ESP32
├── backend/            # ⚙️ API RESTful (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── controllers/# Lógica de rotas (ingestão de dados, IA, auth)
│   │   ├── services/   # Regras de negócio e integração com Supabase/Gemini
│   │   └── routes/     # Definição dos endpoints
│   └── package.json
├── frontend/           # 🎨 Dashboard Web (React + React Router + Vite)
│   ├── app/
│   │   ├── routes/     # Telas da aplicação (Dashboard, Histórico, Auth)
│   │   ├── components/ # Componentes reutilizáveis de UI
│   │   └── lib/        # Integração com API e utilitários
│   └── package.json
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
- **Microcontrolador:** ESP32 (Wi-Fi Nativo, Dual-Core, Deep Sleep)
- **Sensores:** Capacitivos de Umidade do Solo v1.2

### Software e Web
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js, Express, TypeScript
- **Banco de Dados:** PostgreSQL (via plataforma Supabase)
- **Inteligência Artificial:** Google Gemini

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) v18+ instalado.
- Conta e Projeto configurado no [Supabase](https://supabase.com/).
- Chave de API do [Google Gemini](https://aistudio.google.com/).

### 2. Configuração de Variáveis de Ambiente
Tanto a pasta `backend/` quanto `frontend/` possuem arquivos `.env.example`. Crie cópias nomeadas `.env` em ambas as pastas e preencha com suas credenciais de desenvolvimento.

### 3. Instalação e Execução
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

### 4. Testando a API
Você pode importar o arquivo `insomnia/earthsense-api.insomnia.json` no cliente **Insomnia** para testar as rotas de ingestão de dados e interações com a IA.

---

## 🎓 Sobre o Projeto Acadêmico
O EarthSense foi desenvolvido como Trabalho de Conclusão de Curso (TCC) do curso de Ciência da Computação da Universidade Paulista (UNIP) por:
- Brian Borges Santos Silva
- Caio Pacheco Andrade
- Fabricio Da Silva Roza Garcia
- Vitor De Souza Botelho

Orientador: Prof. Marco Gomes
