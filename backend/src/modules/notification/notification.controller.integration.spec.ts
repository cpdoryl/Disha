import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { NotificationController } from './notification.controller';
import { NotificationService, NotificationType, NotificationChannel } from '../../services/notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ParentCommunication } from '../../database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('NotificationController (integration)', () => {
  let app: INestApplication;
  let repo: MockRepo<ParentCommunication>;

  const schoolId = '123e4567-e89b-12d3-a456-426614174000';
  const parentId = '223e4567-e89b-42d3-a456-426614174000';

  beforeAll(async () => {
    repo = createMockRepo<ParentCommunication>();
    (repo.create as jest.Mock).mockImplementation((entity) => entity);
    (repo.save as jest.Mock).mockImplementation((entity) => Promise.resolve({ id: 'comm-1', ...entity }));

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [NotificationService, { provide: getRepositoryToken(ParentCommunication), useValue: repo }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /notifications', () => {
    it('logs a general notification', async () => {
      await request(app.getHttpServer())
        .post('/notifications')
        .send({
          schoolId,
          parentId,
          type: NotificationType.GENERAL_UPDATE,
          channel: NotificationChannel.EMAIL,
          message: 'Report card is ready.',
        })
        .expect(201);
    });

    it('rejects an invalid channel', async () => {
      await request(app.getHttpServer())
        .post('/notifications')
        .send({
          schoolId,
          parentId,
          type: NotificationType.GENERAL_UPDATE,
          channel: 'carrier-pigeon',
          message: 'Report card is ready.',
        })
        .expect(400);
    });
  });

  describe('POST /notifications/attendance-alert', () => {
    it('sends an attendance alert', async () => {
      await request(app.getHttpServer())
        .post('/notifications/attendance-alert')
        .send({ schoolId, parentId, studentName: 'Asha Rao', attendancePercentage: 72 })
        .expect(201);
    });

    it('rejects an out-of-range percentage', async () => {
      await request(app.getHttpServer())
        .post('/notifications/attendance-alert')
        .send({ schoolId, parentId, studentName: 'Asha Rao', attendancePercentage: 150 })
        .expect(400);
    });
  });

  describe('POST /notifications/fee-reminder', () => {
    it('sends a fee reminder', async () => {
      await request(app.getHttpServer())
        .post('/notifications/fee-reminder')
        .send({ schoolId, parentId, amount: 5000, dueDate: '2026-04-01' })
        .expect(201);
    });
  });

  describe('GET /notifications/preferences/:userId', () => {
    it('returns derived preferences', async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get(`/notifications/preferences/${parentId}`).expect(200);

      expect(response.body).toEqual({ preferredChannels: [], notificationTypes: [] });
    });
  });
});
