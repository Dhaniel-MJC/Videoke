/**
 * Database Migration Runner
 * Executes SQL migration files in order
 *
 * Usage:
 *   npx ts-node src/db/migrate.ts
 */

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import pool from './client';

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await readdir(migrationsDir);

    // Sort files numerically to ensure correct order
    const sortedFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${sortedFiles.length} migration(s)`);

    for (const file of sortedFiles) {
      try {
        const filePath = path.join(migrationsDir, file);
        const sql = await readFile(filePath, 'utf-8');

        console.log(`\n⏳ Running migration: ${file}`);
        await pool.query(sql);
        console.log(`✅ Migration succeeded: ${file}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${file}`);
        console.error(error);
        throw error;
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runMigrations();
}

export default runMigrations;
