# 📊 Statistics Dashboard - Setup & Testing Guide

## Overview
The Statistics Dashboard displays user performance history and analytics. This document outlines what's implemented and how to test it.

## ✅ What's Been Implemented

### Backend (Express.js)
- **File**: `/backend/src/routes/users.ts` - User statistics endpoints
  - `GET /api/users/:userId/performances` - All performances with song details
  - `GET /api/users/:userId/performances/summary` - Aggregated stats
  - `GET /api/users/:userId/top-songs` - Top 5 most-sung songs
  - `GET /api/users/:userId/leaderboard` - User rankings

### Frontend (React + TypeScript)
- **Hook**: `/frontend/src/hooks/usePerformanceStats.ts` - Data fetching & aggregation
  - Calculates: total performances, average score, best score, score trend, recent performances, top songs
- **Component**: `/frontend/src/pages/StatsPage.tsx` - Statistics display
  - 4-card stat grid (performances, avg score, best score, time singing)
  - Score trend chart (last 10 performances)
  - Top 5 songs with play counts
  - Recent 5 performances with scores
  - Best performance card with all 7 detailed metrics
- **Styling**: `/frontend/src/pages/StatsPage.module.css` - Dark theme with animations
- **Navigation**: Integrated into LobbyPage & App.tsx

## 🔧 Fixes Applied

### Database Column Names
Fixed mismatched column references in backend queries:
- `p.pitch_accuracy` → `p.pitch` (aliased as `pitch_accuracy`)
- `p.energy_consistency` → `p.energy` (aliased as `energy_consistency`)
- `p.performance_start` → `p.started_at` (aliased as `performance_start`)

### Database Import
Fixed database connection import in `users.ts`:
- Changed: `import pool from '../db/connection'`
- To: `import pool from '../db/client'`

## 🚀 Testing Steps

### 1. Backend Setup
```bash
cd backend

# Install dependencies (if not already done)
npm install

# Run database migrations (creates/updates schema)
npm run migrate

# Start backend server
npm run dev
```

Backend will run on `http://localhost:3000`

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start frontend development server
npm run dev
```

Frontend will run on `http://localhost:5173` (or port shown in console)

### 3. Visual Testing
1. **Login** with existing user credentials
2. **Navigate** to Lobby page
3. **Click** "📊 Estatísticas" button in top-right
4. **Verify** Statistics Dashboard displays:
   - ✅ 4 stat cards (Performances, Score Médio, Melhor Score, Tempo Cantando)
   - ✅ Chart showing score trend (if performances exist)
   - ✅ Top songs list (if songs have been sung)
   - ✅ Recent performances (if performances exist)
   - ✅ Best performance details with all 7 metrics
5. **Empty State**: If user has no performances, should show "Nenhuma performance ainda"

### 4. Backend Testing (API Endpoints)
Test directly using curl or Postman:

```bash
# Get all performances for user (userId=1)
curl http://localhost:3000/api/users/1/performances

# Get performance summary
curl http://localhost:3000/api/users/1/performances/summary

# Get top songs
curl http://localhost:3000/api/users/1/top-songs

# Get leaderboard
curl http://localhost:3000/api/users/1/leaderboard
curl "http://localhost:3000/api/users/1/leaderboard?roomId=1"
```

## 📋 Database Schema

The statistics use these existing tables:

**performances table** (Phase 3 columns used):
- `id` - Performance ID
- `user_id` - User reference
- `song_id` - Song reference
- `overall_score` - Main scoring metric
- `pitch` - Pitch accuracy (0-100)
- `energy` - Energy consistency (0-100)
- `vibrato` - Vibrato quality (0-100)
- `timing` - Timing accuracy (0-100)
- `beat_strength` - Beat strength (0-100)
- `rhythm_accuracy` - Rhythm accuracy (0-100)
- `tempo_consistency` - Tempo consistency (0-100)
- `started_at` - Performance start time
- `duration_seconds` - Performance duration

**songs table** (Phase 4 columns):
- `id` - Song ID
- `title` - Song title
- `artist` - Song artist

## ✨ Polish & Refinement Features (Adicionado)

### 1. Filtro por Período
- Botões: "7 dias", "30 dias", "90 dias", "Tudo"
- Filtra todas as estatísticas pelo período selecionado
- Permite análise temporal do progresso

### 2. Indicador de Tendência
- Mostra se o performance está melhorando ou piorando
- Compara último score com média anterior
- Indicador visual em verde (📈) ou vermelho (📉)
- Percentual de melhora/queda exibido

### 3. Objetivos Recomendados
- 3 metas automáticas:
  - **Próximo Score**: Próxima meta de score médio (+50 pontos)
  - **Próxima Meta**: Próxima meta de performances (+10 performances)
  - **Mais Músicas**: Objetivo de diversidade musical (10 músicas diferentes)
- Barra de progresso visual para cada meta
- Percentual de conclusão

## 🧪 Expected Results

### Empty State (No Performances)
- User sees: "🎤 Nenhuma performance ainda"
- Subtext: "Comece a cantar para ver suas estatísticas!"

### With Performance Data
- 4 stat cards populate with real numbers
- Score trend chart displays bars with colors:
  - 🟢 Green (≥800 points)
  - 🟡 Orange (600-799 points)
  - 🔴 Red (<600 points)
- Top songs sorted by times sung (descending)
- Recent performances show in chronological order (newest first)
- Best performance card shows all 7 metrics as percentages

## 🎨 UI/UX Features

- **Loading State**: Spinner with "Carregando estatísticas..."
- **Error State**: Error message in red box
- **Responsive Design**: Adapts to mobile (480px), tablet (768px), desktop (1024px+)
- **Dark Theme**: Purple/pink gradients with smooth animations
- **Hover Effects**: Cards have subtle transforms and brightness changes

## 📝 Notes

- Statistics are calculated client-side from raw performance data for better performance
- Charts are simple HTML/CSS bars (no external charting library)
- Time is formatted as hours + minutes or just minutes
- All scores are rounded to integers for display
- Percentages are calculated from the database values

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/users/:id/performances" | Ensure backend is running on port 3000 |
| "Error ao buscar estatísticas" | Check browser console for CORS errors, verify API response |
| Empty stats with performances in DB | Clear browser cache, check that performances have `user_id` and `song_id` |
| Scores showing as 0 | Verify performances table has `overall_score` values populated |

## 🔄 Next Steps

After verifying the Statistics Dashboard works:
1. **Polish & Refinement** - Add filtering, sorting, date range selection
2. **Additional Features** - Add social features (compare stats with friends)
3. **Deploy** - Push to production (Render/Vercel)
