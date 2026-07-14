import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PREDEFINED_CHALLENGES } from 'src/database/entities';

/**
 * Full-stack smoke test. Requires a reachable Postgres instance matching
 * DATABASE_HOST/PORT/USER/PASSWORD/NAME (see src/config/configuration.ts),
 * e.g. `docker-compose up -d postgres` locally, or the postgres service
 * container the backend-ci.yml workflow spins up.
 */
describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/challenges returns the seeded challenge menu', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/challenges').expect(200);

    expect(response.body).toHaveLength(PREDEFINED_CHALLENGES.length);
  });

  it('GET /api/v1/assessments/health confirms the assessment module is mounted correctly', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/assessments/health').expect(200);

    expect(response.body.status).toBe('Assessment API healthy');
  });
});
