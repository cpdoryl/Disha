import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DISHA_ENTITIES } from './entities';

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
  // Import entity classes directly (rather than a dist/**/*.entity.js glob) so
  // ts-node-run scripts (seed, migration:generate) and the compiled build both
  // resolve to the same class references — a glob pointed only at dist made
  // ts-node-loaded entity classes register under a different module instance
  // than the ones already loaded by this DataSource, so TypeORM couldn't find
  // their metadata (EntityMetadataNotFoundError) when seeding.
  entities: DISHA_ENTITIES,
  migrations: [path.join(__dirname, '../../dist/database/migrations/*.js')],
  synchronize: false,
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  migrationsTransactionMode: 'each',
});
