# 🚀 Setup Local Development - Videoke

**Status:** Pronto para rodar localmente  
**Data:** 2026-09-12  
**Pré-requisitos:** Node.js, npm, PostgreSQL, Redis

---

## 📋 Pré-Requisitos

### Verificar Instalações
```bash
# Node.js (mínimo v16)
node --version

# npm (mínimo v8)
npm --version

# PostgreSQL (mínimo v12)
psql --version

# Redis (mínimo v6)
redis-cli --version
```

Se algum estiver faltando, instale antes de continuar.

---

## 🔧 Step 1: Setup Backend

### 1.1 Navegar para Backend
```bash
cd backend
```

### 1.2 Instalar Dependências
```bash
npm install
```

### 1.3 Criar `.env` com Variáveis de Ambiente

Criar arquivo `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/videoke

# Redis
REDIS_URL=redis://localhost:6379

# YouTube API
YOUTUBE_API_KEY=sua_chave_api_aqui

# Server
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=debug
```

### 1.4 Obter YouTube API Key

**Opção A: Usar chave de teste** (para development local)
```env
YOUTUBE_API_KEY=AIzaSyBDxYMqJUjqx-2nUaKJ2-UU-xU0K1pQT-E
# Nota: Esta é uma chave de desenvolvimento pública (quota limitada)
```

**Opção B: Gerar sua própria chave**

1. Ir para https://console.cloud.google.com
2. Criar novo projeto
3. Ativar YouTube Data API v3
4. Criar "API Key" em Credenciais
5. Copiar chave para `.env`

### 1.5 Setup do Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U seu_usuario -d postgres

# Inside psql:
CREATE DATABASE videoke;
\q  # sair
```

### 1.6 Rodar Migrations

```bash
# Voltar para pasta backend
cd backend

# Executar migrations
npm run migrate
```

Esperado output:
```
✓ Migration 001_create_initial_schema.sql
✓ Migration 002_add_songs_table.sql
✓ Migration 003_add_playlists_table.sql
✓ Migration 004_add_user_favorites_table.sql
✓ Migration 005_add_songs_to_performances.sql
```

### 1.7 Verificar Schema

```bash
npm run check
```

Esperado output:
```
✓ Database connection OK
✓ Schema verificado
✓ Todas as tabelas presentes
✓ Phase 4 tables OK
```

### 1.8 Iniciar Backend

```bash
npm run dev
```

Esperado output:
```
🚀 Servidor rodando em http://localhost:3000
📊 Database conectado
🔴 Redis conectado
```

**Deixar terminal aberto.** ← Backend está rodando

---

## 🎨 Step 2: Setup Frontend

### 2.1 Abrir Novo Terminal - Navegar para Frontend
```bash
cd frontend
```

### 2.2 Instalar Dependências
```bash
npm install
```

### 2.3 Criar `.env.local` com Variáveis de Ambiente

Criar arquivo `frontend/.env.local`:

```env
# API Backend
VITE_API_URL=http://localhost:3000/api

# Aplicação
VITE_APP_NAME=Videoke
VITE_APP_VERSION=4.0.0

# Environment
VITE_ENV=development
```

### 2.4 Iniciar Frontend

```bash
npm run dev
```

Esperado output:
```
  VITE v4.x.x  dev server running at:

  ➜  Local:   http://127.0.0.1:5173/
  ➜  press h to show help
```

**Deixar terminal aberto.** ← Frontend está rodando

---

## 🌐 Step 3: Verificar Setup

### 3.1 Abrir Browser

Abrir: http://localhost:5173

Você deve ver a página de login do Videoke.

### 3.2 Verificar Conexão com Backend

Abrir terminal e testar:
```bash
curl http://localhost:3000/api/songs/search?q=test

# Esperado: JSON com resultados (ou array vazio se primeira vez)
```

Se não funcionou, verificar:
- Backend está rodando? (Terminal mostra porta 3000?)
- Redis está rodando? (redis-server)
- PostgreSQL está rodando? (psql funciona?)

---

## 🧪 Step 4: Testar Fluxo Completo

### 4.1 Login
1. Ir para http://localhost:5173
2. Fazer login ou criar conta
3. Criar uma sala ou entrar em uma existente

### 4.2 Buscar Música
1. Clicar em "Buscar Música"
2. Digitar uma query (ex: "bohemian")
3. Aguardar resultados (pode levar 2-3 segundos na primeira vez)
4. Ver grid com SongCards

### 4.3 Selecionar e Cantar
1. Passar mouse sobre um card
2. Clicar "Cantar" (botão roxo)
3. YouTubePlayer deve carregar
4. Clicar "Começar a Cantar"
5. Cantar por 10-15 segundos
6. Ver score em tempo real
7. Clicar "Parar de Cantar"

### 4.4 Verificar Database
```bash
# Em novo terminal
psql -U seu_usuario -d videoke

# Dentro do psql:
SELECT * FROM songs LIMIT 5;
SELECT * FROM performances LIMIT 5;
\q
```

---

## 🐛 Troubleshooting

### Backend não conecta ao Database
```
Erro: "connect ECONNREFUSED"

Solução:
1. Verificar PostgreSQL está rodando: pg_isready
2. Verificar DATABASE_URL está correto em .env
3. Verificar banco 'videoke' existe: psql -l
```

### Backend não conecta ao Redis
```
Erro: "Error: connect ECONNREFUSED 127.0.0.1:6379"

Solução:
1. Iniciar Redis: redis-server
2. Verificar REDIS_URL está correto em .env
```

### Frontend não conecta ao Backend
```
Erro: "Failed to fetch from http://localhost:3000"

Solução:
1. Verificar backend está rodando: curl http://localhost:3000/api/songs/search?q=test
2. Verificar VITE_API_URL em .env.local
3. Limpar cache: rm -rf node_modules/.vite
```

### YouTube Search retorna erro
```
Erro: "403 Forbidden - Quota exceeded"

Solução:
1. YouTube API key tem quota limitada
2. Aguardar 1 hora para reset
3. Usar outra chave ou criar sua própria

Ou usar chave de teste mais poderosa (pedir ao admin)
```

### Não consegue cantar (sem áudio)
```
Erro: "Erro ao iniciar captura de áudio"

Solução:
1. Permitir acesso ao microfone no browser
2. Verificar microfone conectado
3. Testar microfone em outro app
4. Abrir DevTools (F12) → Console → ver erro específico
```

---

## 📱 Acessar de Outro Dispositivo

### Encontrar IP Local
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

Exemplo: `192.168.1.100`

### Acessar Frontend do Outro Dispositivo
```
http://192.168.1.100:5173
```

### Verificar: 
- Ambos dispositivos na mesma rede WiFi
- Firewall não bloqueando portas 3000, 5173, 5432, 6379
- Backend `.env` com `DATABASE_URL` acessível

---

## 🔄 Workflow de Desenvolvimento

### Todo dia, para rodar o app:

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
# Deixar aberto
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
# Deixar aberto
```

**Terminal 3 - Browser**
```bash
open http://localhost:5173
```

### Editar código:
- Salvar arquivo
- Frontend/Backend auto-reload (hot module replacement)
- Refresh browser se necessário

### Parar Desenvolvimento:
```bash
# Terminal 1: Ctrl+C
# Terminal 2: Ctrl+C
# Pronto! ✓
```

---

## 📊 Verificar Status

### Tudo rodando?
```bash
# Testar Backend
curl -s http://localhost:3000/api/songs/search?q=test | jq .

# Testar Frontend
open http://localhost:5173

# Testar Database
psql -U seu_usuario -d videoke -c "SELECT COUNT(*) FROM users;"

# Testar Redis
redis-cli ping  # Esperado: PONG
```

---

## 🎯 Comandos Úteis

### Backend
```bash
cd backend

# Rodar em development
npm run dev

# Rodar migrations novamente (idempotente)
npm run migrate

# Verificar schema
npm run check

# Limpar cache Redis
redis-cli FLUSHDB

# Logs da database
psql -U seu_usuario -d videoke -c "\dt"  # Listar tabelas
```

### Frontend
```bash
cd frontend

# Rodar em development
npm run dev

# Compilar para produção
npm run build

# Preview de build
npm run preview

# Limpar cache
rm -rf .vite dist node_modules/.vite
```

---

## 📚 Documentação Relacionada

- `PHASE4_PROGRESS_REPORT.md` - Status geral Phase 4
- `PHASE4_STEP4_INTEGRATION.md` - Integração RoomPage
- `PHASE4_INTEGRATION_GUIDE.md` - Exemplos de API
- `PHASE4_DATABASE_SETUP.md` - Schema detalhado

---

## ✅ Checklist: Setup Completo

- [ ] Node.js, npm, PostgreSQL, Redis instalados
- [ ] Backend `.env` criado com variáveis
- [ ] Migrations rodadas com sucesso
- [ ] Backend rodando em http://localhost:3000
- [ ] Frontend `.env.local` criado
- [ ] Frontend rodando em http://localhost:5173
- [ ] Browser conectado ao frontend
- [ ] Fluxo de login funciona
- [ ] Busca de música funciona
- [ ] Pode cantar e ver score

---

**Setup Completo! ✅**

Aplicativo Videoke pronto para desenvolvimento e teste visual.

Divirta-se! 🎤 🎵
