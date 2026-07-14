import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AppModule } from '../src/app.module';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

export let app: INestApplication;
export let moduleFixture: TestingModule;

export async function setupTestApp() {
  moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  // Apply same middleware as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return app;
}

export async function teardownTestApp() {
  if (app) {
    await app.close();
  }
  if (moduleFixture) {
    await moduleFixture.close();
  }
}

// Test user credentials (from seed data)
export const TEST_USERS = {
  rylAdmin: {
    email: 'admin1@school.edu',
    password: 'admin123',
    role: 'ryl_admin',
  },
  schoolAdmin: {
    email: 'admin2@school.edu',
    password: 'admin123',
    role: 'school_admin',
  },
  teacher: {
    email: 'teacher1@school.edu',
    password: 'teacher123',
    role: 'teacher',
  },
};

// Helper function to login and get token
export async function loginAndGetToken(
  testApp: INestApplication,
  email: string,
  password: string,
) {
  const response = await testApp.get('/api/v2/auth/login').send({
    email,
    password,
  });

  return response.body.accessToken;
}

// Helper to make authenticated request
export async function authenticatedRequest(
  testApp: INestApplication,
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  token: string,
  data?: any,
) {
  const req = testApp[method](path).set('Authorization', `Bearer ${token}`);

  if (data) {
    req.send(data);
  }

  return req;
}
