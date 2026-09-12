# 🎤 Phase 3 - Quick Start Guide

**Status:** ✅ Pronto para Testes  
**Tempo:** ~2 minutos de setup

---

## 1️⃣ Setup Rápido

### Se é banco novo (Docker)

```bash
docker-compose up --build
```

Pronto! Schema é aplicado automaticamente. ✅

### Se é banco existente

```bash
cd backend
npm run migrate
```

Verifica e aplica as 10 colunas Phase 3. ✅

---

## 2️⃣ Verificar se Tudo Está OK

```bash
cd backend
npm run check
```

Resultado esperado:
```
✅ Database Connection
✅ Phase 3 Columns (performances)
✅ Performance Feedback Table
✅ Database Indexes
✅ ENV: DATABASE_URL
✅ FILE: backend/src/handlers/performanceHandler.ts
... etc

🟢 SISTEMA PRONTO - Phase 3 está totalmente configurado!
```

---

## 3️⃣ Iniciar o Backend

```bash
cd backend
npm run dev
```

Você verá:
```
🎤 Videoke server running on port 3000
✅ Performance events registrados
```

---

## 4️⃣ Testar (Quando Frontend Estiver Pronto)

Abra `http://localhost:5173/` e:

1. **Selecione uma música**
   - Busque por título/artista
   - Clique para selecionar

2. **Comece a cantar**
   - Clique "🎤 Começar a Cantar"
   - Permita acesso ao microfone
   - Fale/cante por 3-5 segundos

3. **Observe as métricas em tempo real**
   - Score geral (0-100)
   - 4 barras: Afinação, Volume, Vibrato, Sincronismo
   - BPM detectado
   - Precisão rítmica %
   - Consistência de tempo %

4. **Finalize a apresentação**
   - Clique "⏹️ Parar de Cantar"
   - Veja score final + feedback personalizado

5. **Verifique o placar**
   - Lado direito: "🏆 Placar da Sala"
   - Seu ranking + badges

---

## 📊 Dados Armazenados

Cada performance salva 10 campos:

```json
{
  "score": 82,                    // Score geral
  "pitch": 85,                    // Afinação
  "energy": 80,                   // Volume
  "vibrato": 75,                  // Vibrato
  "timing": 88,                   // Síncrono
  "beat_strength": 90,            // Sincronismo c/ batida
  "rhythm_accuracy": 85,          // Precisão rítmica
  "tempo_consistency": 80,        // Consistência de tempo
  "bpm": 120,                     // Batidas por minuto
  "duration_seconds": 180,        // Duração em segundos
  "feedback": [                   // Feedback personalizado
    "🎵 Afinação perfeita!",
    "🔊 Excelente projeção!",
    "⏱️ Perfeito sincronismo!"
  ]
}
```

---

## 🔍 Verificar Dados no Banco

```bash
# Conectar ao PostgreSQL
psql postgresql://postgres:videoke_dev@localhost:5432/videoke

# Ver performances
SELECT id, user_id, score, pitch, energy, vibrato, 
       beat_strength, rhythm_accuracy, bpm, created_at 
FROM performances 
ORDER BY created_at DESC LIMIT 5;

# Ver feedback
SELECT pf.*, p.user_id, p.score 
FROM performance_feedback pf 
JOIN performances p ON pf.performance_id = p.id 
LIMIT 5;

# Ver leaderboard
SELECT u.username, 
       COUNT(p.id) as performances,
       ROUND(AVG(p.score), 2) as avg_score,
       MAX(p.score) as best_score
FROM users u 
LEFT JOIN performances p ON u.id = p.user_id 
GROUP BY u.id, u.username 
ORDER BY avg_score DESC;
```

---

## 🐛 Troubleshooting

### ❌ "column score does not exist"

```bash
npm run migrate
npm run check
```

### ❌ "WebSocket not connecting"

Verifique:
```bash
# DevTools → Network → Filter "WS"
# Vê conexão socket.io?

# Se não, verifique console (F12)
# Erro de permissão? Microfone?
```

### ❌ "Score zerado"

Verifique microfone:
1. Abra DevTools (F12)
2. Aba Console
3. Procure por "ERROR" ou "permission"
4. Se diz "permission denied": Chrome Settings → Privacy → Microphone → Allow localhost:5173

---

## 📈 WebSocket Events (Reference)

### Cliente Envia

```javascript
// Começar
socket.emit('start_singing', {
  userId: "user_123",
  roomId: "room_456",
  songId: "song_789"
});

// Métricas (a cada 100-200ms)
socket.emit('audio_metrics', {
  userId: "user_123",
  roomId: "room_456",
  score: 82, pitch: 85, energy: 80, vibrato: 75,
  timing: 88, beatStrength: 90, rhythmAccuracy: 85,
  tempoConsistency: 80, bpm: 120
});

// Parar
socket.emit('stop_singing', {
  userId: "user_123",
  roomId: "room_456",
  songId: "song_789",
  score: 82, pitch: 85, energy: 80, vibrato: 75,
  timing: 88, beatStrength: 90, rhythmAccuracy: 85,
  tempoConsistency: 80, bpm: 120,
  durationSeconds: 180,
  feedback: ["🎵 Afinação perfeita!", ...]
});
```

### Servidor Responde

```javascript
// Confirmações
socket.emit('singing_started', { status: 'ok' });
socket.emit('singing_stopped', { status: 'ok', message: 'Performance salva' });

// Streaming (broadcast)
socket.emit('audio_metrics_update', {
  userId, score, pitch, energy, vibrato, beatStrength, bpm
});

// Após salvar
socket.emit('performance_saved', {
  performanceId: "perf_123",
  leaderboard: [...]
});

socket.emit('leaderboard_updated', {
  roomId: "room_456",
  leaderboard: [...]
});
```

---

## ✅ Checklist Pré-Teste

- [ ] `npm run check` mostra "SISTEMA PRONTO"
- [ ] `npm run dev` roda sem erros
- [ ] Browser abre http://localhost:5173
- [ ] WebSocket conectado (Network tab)
- [ ] Microfone funciona (sistema operacional)
- [ ] DevTools console limpo (sem erros)

---

## 📝 Próximas Fases

**Phase 4 (Soon!):**
- YouTube integration
- Song catalog
- Playlists
- Social features
- Analytics

---

## 📚 Documentos Relacionados

- `PHASE3_RESUMO.md` - Visão geral técnica
- `PHASE3_DATABASE_SETUP.md` - Schema e migrations
- `PHASE3_COMPLETE_STATUS.md` - Status completo
- `TESTES_PHASE3.md` - Checklist de testes detalhado

---

**Phase 3 está 100% pronto!** 🚀

Qualquer dúvida durante os testes, verifique os logs no backend (terminal) e DevTools (browser).

Bom teste! 🎤🎵
