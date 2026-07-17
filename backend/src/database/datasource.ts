import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'disha_db',
  // This datasource is only used by CLI tooling (migration:generate/run,
  // seed:db), which always runs through ts-node — so it registers entities
  // straight from TS source, matching what seed.ts and the migration files
  // import directly. Pointing this at compiled dist/ output instead causes
  // TypeORM to see two different class instances for the "same" entity
  // (one ts-node-compiled in memory, one precompiled on disk) and fail with
  // "No metadata for X was found." The running NestJS app has its own
  // separate entities glob in app.module.ts and is unaffected by this.
  entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  migrationsTransactionMode: 'each',
});
