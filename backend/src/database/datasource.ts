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
  entities: [path.join(__dirname, '../database/entities/*.entity.ts')],
  migrations: [path.join(__dirname, '../database/migrations/*.ts')],
  synchronize: false,
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  migrationsTransactionMode: 'each',
});
