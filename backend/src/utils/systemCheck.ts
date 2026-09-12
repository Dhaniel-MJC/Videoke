/**
 * System Health Check for Phase 3
 * Verifica se todos os componentes estão configurados corretamente
 *
 * Usage:
 *   npx ts-node src/utils/systemCheck.ts
 */

import pool from '../db/client';

interface CheckResult {
  name: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  details: string;
}

const results: CheckResult[] = [];

async function checkDatabase() {
  try {
    console.log('📊 Verificando banco de dados...\n');

    // Test connection
    const connResult = await pool.query('SELECT NOW()');
    results.push({
      name: 'Database Connection',
      status: 'OK',
      details: `Conectado: ${connResult.rows[0].now}`,
    });

    // Check Phase 3 columns
    const columnsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'performances'
      AND column_name IN ('score', 'pitch', 'energy', 'vibrato', 'timing', 'beat_strength', 'rhythm_accuracy', 'tempo_consistency', 'bpm', 'duration_seconds')
      ORDER BY column_name
    `);

    const expectedColumns = [
      'beat_strength',
      'bpm',
      'duration_seconds',
      'energy',
      'pitch',
      'rhythm_accuracy',
      'score',
      'tempo_consistency',
      'timing',
      'vibrato',
    ];

    const foundColumns = columnsResult.rows
      .map((r) => r.column_name)
      .sort();

    if (JSON.stringify(foundColumns) === JSON.stringify(expectedColumns)) {
      results.push({
        name: 'Phase 3 Columns (performances)',
        status: 'OK',
        details: `Todas 10 colunas presentes: ${foundColumns.join(', ')}`,
      });
    } else {
      results.push({
        name: 'Phase 3 Columns (performances)',
        status: 'ERROR',
        details: `Faltam colunas. Encontradas: ${foundColumns.join(', ')}. Esperadas: ${expectedColumns.join(', ')}`,
      });
    }

    // Check performance_feedback table
    const feedbackTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'performance_feedback'
      )
    `);

    if (feedbackTableResult.rows[0].exists) {
      results.push({
        name: 'Performance Feedback Table',
        status: 'OK',
        details: 'Tabela performance_feedback existe',
      });
    } else {
      results.push({
        name: 'Performance Feedback Table',
        status: 'ERROR',
        details: 'Tabela performance_feedback não encontrada',
      });
    }

    // Check Phase 4 tables (songs, playlists, playlist_songs, user_favorites)
    const phase4Tables = ['songs', 'playlists', 'playlist_songs', 'user_favorites'];
    const phase4TablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name IN ('songs', 'playlists', 'playlist_songs', 'user_favorites')
    `);

    const foundPhase4Tables = phase4TablesResult.rows.map((r) => r.table_name);
    const missingPhase4Tables = phase4Tables.filter(
      (tbl) => !foundPhase4Tables.includes(tbl)
    );

    if (missingPhase4Tables.length === 0) {
      results.push({
        name: 'Phase 4 Tables (songs, playlists, etc)',
        status: 'OK',
        details: `Todas 4 tabelas Phase 4 presentes: ${foundPhase4Tables.join(', ')}`,
      });
    } else {
      results.push({
        name: 'Phase 4 Tables (songs, playlists, etc)',
        status: 'WARNING',
        details: `Tabelas encontradas: ${foundPhase4Tables.join(', ')}. Faltam: ${missingPhase4Tables.join(', ')}`,
      });
    }

    // Check indexes
    const indexesResult = await pool.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename IN ('performances', 'performance_feedback')
      ORDER BY indexname
    `);

    const criticalIndexes = [
      'idx_performance_feedback_performance_id',
      'idx_performances_room_user',
      'idx_performances_score',
    ];

    const foundIndexes = indexesResult.rows.map((r) => r.indexname);
    const missingIndexes = criticalIndexes.filter(
      (idx) => !foundIndexes.includes(idx)
    );

    if (missingIndexes.length === 0) {
      results.push({
        name: 'Database Indexes',
        status: 'OK',
        details: `Todos índices críticos presentes (${foundIndexes.length} total)`,
      });
    } else {
      results.push({
        name: 'Database Indexes',
        status: 'WARNING',
        details: `Faltam índices: ${missingIndexes.join(', ')}`,
      });
    }
  } catch (error) {
    results.push({
      name: 'Database Check',
      status: 'ERROR',
      details: `Erro: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function checkFiles() {
  console.log('\n📁 Verificando arquivos necessários...\n');

  const requiredFiles = [
    'backend/src/handlers/performanceHandler.ts',
    'backend/src/events/performanceEvents.ts',
    'backend/src/routes/performances.ts',
    'backend/src/db/schema.sql',
    'backend/src/db/migrations/001_add_phase3_metrics.sql',
  ];

  // Assuming we're running from backend root
  const { existsSync } = require('fs');

  for (const file of requiredFiles) {
    const exists = existsSync(file);
    results.push({
      name: `File: ${file}`,
      status: exists ? 'OK' : 'ERROR',
      details: exists
        ? 'Arquivo encontrado'
        : 'Arquivo não encontrado (execute de backend root)',
    });
  }
}

async function checkEnvironment() {
  console.log('\n🔧 Verificando variáveis de ambiente...\n');

  const required = ['DATABASE_URL', 'NODE_ENV'];

  for (const envVar of required) {
    const value = process.env[envVar];
    results.push({
      name: `ENV: ${envVar}`,
      status: value ? 'OK' : 'WARNING',
      details: value ? `${envVar}=${value.substring(0, 50)}...` : 'Não configurada',
    });
  }
}

function printResults() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         PHASE 3 SYSTEM CHECK - RESULTS                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  for (const result of results) {
    const icon =
      result.status === 'OK' ? '✅' : result.status === 'ERROR' ? '❌' : '⚠️ ';
    console.log(`${icon} ${result.name}`);
    console.log(`   → ${result.details}\n`);
  }

  const summary = {
    total: results.length,
    ok: results.filter((r) => r.status === 'OK').length,
    error: results.filter((r) => r.status === 'ERROR').length,
    warning: results.filter((r) => r.status === 'WARNING').length,
  };

  console.log('════════════════════════════════════════════════════════════');
  console.log(`📊 Total: ${summary.total} | ✅ OK: ${summary.ok} | ❌ Erro: ${summary.error} | ⚠️ Aviso: ${summary.warning}`);
  console.log('════════════════════════════════════════════════════════════\n');

  if (summary.error > 0) {
    console.log('🔴 SISTEMA NÃO ESTÁ PRONTO - Corrija os erros acima');
    process.exit(1);
  } else if (summary.warning > 0) {
    console.log('🟡 SISTEMA FUNCIONAL - Mas há avisos a revisar');
    process.exit(0);
  } else {
    console.log('🟢 SISTEMA PRONTO - Phase 3 está totalmente configurado!');
    process.exit(0);
  }
}

async function runAll() {
  try {
    console.log('🎤 VIDEOKE PHASE 3 - SYSTEM CHECK');
    console.log('═════════════════════════════════════════════════════════\n');

    await checkDatabase();
    checkFiles();
    checkEnvironment();

    printResults();
  } catch (error) {
    console.error('Erro durante verificação:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAll();
}

export default runAll;
