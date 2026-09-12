# 🎤 Videoke - Aplicativo de Karaokê em Tempo Real

Um aplicativo web moderno para cantar karaokê com amigos, com análise de áudio em tempo real, sistema de pontuação e votação.

## 📋 Requisitos

- Docker e Docker Compose
- Node.js 18+ (se executar localmente sem Docker)
- PostgreSQL 15+ (se não usar Docker)
- Redis 7+ (se não usar Docker)

## 🚀 Início Rápido

### Com Docker Compose (Recomendado)

1. Clone o repositório e navegue até a pasta raiz:
```bash
cd videoke
```

2. Crie o arquivo `.env` para o backend:
```bash
cp backend/.env.example backend/.env
```

3. Inicie os containers:
```bash
docker-compose up
```

4. Aguarde até que todos os serviços estejam rodando:
   - PostgreSQL: porta 5432
   - Redis: porta 6379
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

5. Abra no navegador: **http://localhost:5173**

### Desenvolvimento Local (sem Docker)

#### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

O servidor rodará em `http://localhost:3000`

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação rodará em `http://localhost:5173`

#### Banco de Dados

Crie um banco PostgreSQL:

```bash
createdb videoke
psql videoke < backend/src/db/schema.sql
```

Configure o arquivo `.env` do backend com a URL de conexão.

## 📁 Estrutura do Projeto

```
videoke/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Servidor principal
│   │   ├── db/                # Conexão e schema do banco
│   │   ├── routes/            # Rotas da API
│   │   ├── handlers/          # WebSocket handlers
│   │   └── services/          # Lógica de negócio
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # Componentes de página
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── hooks/             # Hooks customizados
│   │   ├── store/             # Estado com Zustand
│   │   ├── utils/             # Funções utilitárias
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── Dockerfile
│
└── docker-compose.yml
```

## 🔑 Variáveis de Ambiente

### Backend (`.env`)

```
DATABASE_URL=postgresql://postgres:videoke_dev@localhost:5432/videoke
REDIS_URL=redis://redis:6379
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend

```
VITE_API_URL=http://localhost:3000
```

## 🌐 Endpoints da API

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/verify` - Verificar token

### Salas

- `GET /api/rooms` - Listar todas as salas
- `POST /api/rooms` - Criar nova sala
- `GET /api/rooms/:roomId` - Obter detalhes da sala
- `PUT /api/rooms/:roomId` - Atualizar sala
- `DELETE /api/rooms/:roomId` - Deletar sala

### Performances

- `GET /api/performances/room/:roomId` - Histórico de apresentações
- `GET /api/performances/:performanceId` - Detalhes de uma apresentação
- `GET /api/performances/user/:userId` - Histórico do usuário
- `GET /api/performances/room/:roomId/leaderboard` - Ranking da sala
- `GET /api/performances/global/top` - Ranking global

## 🎵 WebSocket Events

### Eventos do Cliente

- `join_room` - Entrar em uma sala
- `start_singing` - Começar a cantar
- `audio_metrics` - Enviar métricas de áudio
- `end_singing` - Terminar apresentação
- `rate_performance` - Avaliar performance

### Eventos do Servidor

- `room_joined` - Confirmação de entrada na sala
- `user_joined` - Novo usuário entrou
- `performance_started` - Nova performance começou
- `score_update` - Atualização de pontuação
- `performance_ended` - Performance terminou
- `rating_added` - Nova avaliação recebida
- `user_left` - Usuário saiu da sala

## 🔧 Principais Tecnologias

### Backend

- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados
- **Redis** - Cache e Pub/Sub
- **Socket.io** - WebSocket em tempo real
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Socket.io Client** - WebSocket client
- **Axios** - HTTP client

## 📊 Fluxo de Desenvolvimento Atual

### Fase 1 (Semanas 1-2) ✅ COMPLETA
- [x] Estrutura de pastas
- [x] Backend Express + TypeScript
- [x] Frontend React + Vite + Tailwind
- [x] Docker Compose setup
- [x] PostgreSQL schema
- [x] Autenticação JWT
- [x] WebSocket básico
- [x] Documentação

### Próximas Fases

**Fase 2 (Semanas 3-4):** Análise de Áudio & Pitch Detection
- Hook de captura de microfone
- Integração Essentia.js
- Cálculo de accuracy
- Sincronização de áudio

**Fase 3 (Semanas 5-6):** Song Player & Scoring
- Reprodutor Spotify/YouTube
- Sistema de scoring avançado
- Leaderboard
- Histórico de performances

**Fase 4 (Semanas 7-8):** UI/UX & Polish
- Interface melhorada
- Feedback visual
- Testes
- Deploy

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 Exemplo de Uso

1. **Registre-se** ou **Faça login**
2. **Crie uma sala** ou **Entre em uma existente**
3. **Pressione "Começar a Cantar"**
4. **O sistema analisará seu áudio** e calculará sua pontuação
5. **Outros usuários votam** na sua apresentação
6. **Confira o leaderboard** para ver os melhores cantores

## 🐛 Troubleshooting

### Erro de conexão com banco de dados

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Certifique-se de que PostgreSQL está rodando e a URL está correta no `.env`.

### Erro ao compilar TypeScript

```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### WebSocket não conecta

Verifique se:
- Backend está rodando em http://localhost:3000
- CORS está configurado corretamente
- Firewall não está bloqueando conexões

## 📚 Documentação Adicional

- [Plano de Implementação Completo](./docs/PLAN.md)
- [Arquitetura do Sistema](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)

## 👤 Autor

Desenvolvido com ❤️ para fãs de karaokê

## 📄 Licença

MIT

---

**Próximo passo:** Implementar análise de áudio com Essentia.js para capturar pitch em tempo real!
