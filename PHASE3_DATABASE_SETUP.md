# 🗄️ Phase 3 - Database Setup

**Status:** ✅ Complete  
**Date:** 2026-09-12

---

## 📋 Resumo da Configuração

O banco de dados foi atualizado para suportar as métricas avançadas do Phase 3. Todos os 7 scores e metadados agora são armazenados e consultáveis.

---

## 🛠️ Alterações Implementadas

### 1. Tabela `performances` - Novos Campos

Adicionados 10 novos campos para armazenar métricas do Phase 3:

| Campo | Tipo | Descrição | Range |
|-------|------|-----------|-------|
| `score` | FLOAT | Score geral combinado | 0-100 |
| `pitch` | FLOAT | Afinação / Precision de notas | 0-100 |
| `energy` | FLOAT | Volume / Projeção vocal | 0-100 |
| `vibrato` | FLOAT | Oscilação e controle vocal | 0-100 |
| `timing` | FLOAT | Síncrono com batida | 0-100 |
| `beat_strength` | FLOAT | Força de sincronismo com batida | 0-100 |
| `rhythm_accuracy` | FLOAT | Precisão rítmica | 0-100 |
| `tempo_consistency` | FLOAT | Consistência de tempo | 0-100 |
| `bpm` | INT | Batidas por minuto detectadas | 60-240 |
| `duration_seconds` | INT | Duração da performance | segundos |

### 2. Tabela `performance_feedback`

Nova tabela para armazenar feedback detalhado:

```sql
CREATE TABLE performance_feedback (
  id SERIAL PRIMARY KEY,
  performance_id INTEGER REFERENCES performances(id),
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemplo:**
```json
{
  "performance_id": 42,
  "feedback": [
    "🎵 Afinação perfeita! Você manteve notas muito precisas.",
    "🔊 Excelente projeção vocal! Voz firme e clara.",
    "⏱️ Perfeito sincronismo com a batida da música!"
  ]
}
```

### 3. Índices de Performance

Adicionados índices para otimizar queries frequentes:

```sql
CREATE INDEX idx_performances_score ON performances(score DESC);
CREATE INDEX idx_performances_room_user ON performances(room_id, user_id);
CREATE INDEX idx_performance_feedback_performance_id ON performance_feedback(performance_id);
```

**Benefício:** Leaderboard queries são muito mais rápidas (room ranking por score).

---

## 🚀 Como Aplicar as Alterações

### Opção 1: Docker (Recomendado para Novo Banco)

Se está iniciando um novo banco de dados, as alterações são aplicadas **automaticamente**:

```bash
docker-compose up --build
```

O `schema.sql` é executado automaticamente pelo PostgreSQL no init.

### Opção 2: Banco Existente (Usar Migrations)

Se já tem um banco com dados, use o migration runner:

```bash
cd backend
npm run migrate
```

Isto executa:
- `/backend/src/db/migrations/001_add_phase3_metrics.sql`

**O que faz:**
- Adiciona 10 colunas à tabela `performances`
- Cria tabela `performance_feedback`
- Cria índices necessários
- Usa `IF NOT EXISTS` para ser idempotente (seguro de rodar múltiplas vezes)

---

## 📊 Fórmula de Score (Referência)

Os 7 metrics são combinados com estes pesos:

```
score = (pitch × 0.35) 
      + (energy × 0.15)
      + (vibrato × 0.10)
      + (timing × 0.10)
      + (beatStrength × 0.15)
      + (rhythmAccuracy × 0.10)
      + (tempoConsistency × 0.05)
```

**Exemplo:**
```
pitch=80, energy=70, vibrato=60, timing=75, 
beatStrength=85, rhythmAccuracy=80, tempoConsistency=78

score = (80×0.35) + (70×0.15) + (60×0.10) + (75×0.10) 
      + (85×0.15) + (80×0.10) + (78×0.05)
      = 28 + 10.5 + 6 + 7.5 + 12.75 + 8 + 3.9
      = 76.65 ≈ 77
```

---

## 🔄 Fluxo de Dados

### 1. Cliente (Frontend) - RoomPage_Integrated.tsx

```typescript
// Inicia captura
await play();
await startCapture();

// Envia métricas a cada 100-200ms
socket.emit('audio_metrics', {
  userId, roomId, score, pitch, energy, vibrato, timing,
  beatStrength, rhythmAccuracy, tempoConsistency, bpm
});

// Ao parar, envia score final
socket.emit('stop_singing', {
  userId, roomId, songId,
  score, pitch, energy, vibrato, timing,
  beatStrength, rhythmAccuracy, tempoConsistency, bpm,
  durationSeconds, feedback: []
});
```

### 2. Servidor WebSocket - performanceEvents.ts

```typescript
// Recebe métricas (streaming, não salva)
socket.on('audio_metrics', async (data) => {
  // Apenas broadcast para sala
  socket.to(data.roomId).emit('audio_metrics_update', data);
});

// Recebe score final
socket.on('stop_singing', async (data) => {
  // Salva no banco
  const performanceId = await performanceHandler.savePerformance(data);
  
  // Atualiza leaderboard
  const leaderboard = await performanceHandler.getRoomLeaderboard(data.roomId);
  
  // Broadcast para sala
  socket.to(data.roomId).emit('performance_saved', { performanceId, leaderboard });
});
```

### 3. Banco de Dados - performanceHandler.ts

```typescript
// Insere todos os 7 metrics
await db.query(
  `INSERT INTO performances 
   (user_id, room_id, song_id, score, pitch, energy, vibrato, timing,
    beat_strength, rhythm_accuracy, tempo_consistency, bpm, duration_seconds)
   VALUES ($1, $2, ..., $13)`,
  [userId, roomId, songId, score, pitch, energy, vibrato, timing, ...]
);

// Salva feedback separadamente
if (data.feedback.length > 0) {
  await db.query(
    `INSERT INTO performance_feedback (performance_id, feedback)
     VALUES ($1, $2)`,
    [performanceId, JSON.stringify(data.feedback)]
  );
}
```

---

## 🏆 Leaderboard Query

O leaderboard é construído a partir dos dados armazenados:

```sql
SELECT
  u.id,
  u.username,
  AVG(p.score) as average_score,
  COUNT(p.id) as performance_count,
  MAX(p.score) as last_performance_score
FROM users u
LEFT JOIN performances p ON u.id = p.user_id AND p.room_id = $1
WHERE u.id IN (SELECT user_id FROM room_members WHERE room_id = $1)
GROUP BY u.id, u.username
ORDER BY average_score DESC
```

**Resultado:**
```json
{
  "userId": "user_123",
  "username": "João",
  "averageScore": 82,
  "performances": 5,
  "lastPerformanceScore": 87,
  "badges": ["gold_medal", "consistency", "star"]
}
```

---

## 🎯 Verificação Pós-Instalação

Após aplicar as alterações, verifique:

```sql
-- 1. Verificar colunas Phase 3
\d performances

-- Deve mostrar:
-- score, pitch, energy, vibrato, timing, beat_strength, 
-- rhythm_accuracy, tempo_consistency, bpm, duration_seconds

-- 2. Verificar tabela feedback
\d performance_feedback

-- Deve mostrar: id, performance_id, feedback, created_at

-- 3. Verificar índices
\di

-- Deve incluir:
-- idx_performances_score
-- idx_performances_room_user
-- idx_performance_feedback_performance_id
```

---

## 🔍 Troubleshooting

### ❌ "column score does not exist"

**Causa:** Migrations não foram rodadas em banco existente

**Solução:**
```bash
cd backend
npm run migrate
```

### ❌ "permission denied" ao rodar migrate

**Causa:** DATABASE_URL não está configurada corretamente

**Solução:**
```bash
# Verificar .env
cat .env

# Deve ter:
# DATABASE_URL=postgresql://postgres:videoke_dev@localhost:5432/videoke
```

### ❌ Docker schema não atualizou

**Causa:** Volume do PostgreSQL está em cache

**Solução:**
```bash
# Limpar volumes
docker-compose down -v

# Reiniciar
docker-compose up --build
```

---

## 📝 Próximos Passos

1. ✅ **Database Schema Updated** - Phase 3 columns and indexes ready
2. ⏳ **Frontend Integration** - RoomPage_Integrated.tsx ready for testing
3. ⏳ **WebSocket Events** - performanceEvents.ts ready for binding
4. ⏳ **Visual Testing** - User will test in browser when frontend ready

---

## 📚 Referências

- `schema.sql` - Definição completa do banco
- `migrations/001_add_phase3_metrics.sql` - Migration para bancos existentes
- `performanceHandler.ts` - Queries do banco
- `performanceEvents.ts` - WebSocket event bindings
- `RoomPage_Integrated.tsx` - Frontend integration

**Banco pronto para Phase 3!** 🚀
