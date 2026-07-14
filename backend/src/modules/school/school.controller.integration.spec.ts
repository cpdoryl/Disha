import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { SchoolController } from './school.controller';
import { SchoolService } from '../../services/school.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { School, District, Organization, CityTier, BoardType } from '../../database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('SchoolController (integration)', () => {
  let app: INestApplication;
  let schoolRepo: MockRepo<School>;
  let districtRepo: MockRepo<District>;

  const validSchoolPayload = {
    organizationId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Greenwood High',
    district: 'Central',
    state: 'Karnataka',
    city: 'Bengaluru',
    cityTier: CityTier.TIER_1,
    boardType: BoardType.CBSE,
    studentCount: 500,
    staffCount: 40,
  };

  beforeAll(async () => {
    schoolRepo = createMockRepo<School>();
    districtRepo = createMockRepo<District>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SchoolController],
      providers: [
        SchoolService,
        { provide: getRepositoryToken(School), useValue: schoolRepo },
        { provide: getRepositoryToken(District), useValue: districtRepo },
        { provide: getRepositoryToken(Organization), useValue: createMockRepo<Organization>() },
      ],
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

  describe('POST /schools', () => {
    it('creates a school', async () => {
      (schoolRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (schoolRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve({ id: 'school-1', ...entity }));

      const response = await request(app.getHttpServer()).post('/schools').send(validSchoolPayload).expect(201);

      expect(response.body.id).toBe('school-1');
    });

    it('rejects an invalid cityTier', async () => {
      await request(app.getHttpServer())
        .post('/schools')
        .send({ ...validSchoolPayload, cityTier: 'not-a-tier' })
        .expect(400);
    });

    it('rejects a payload missing required fields', async () => {
      await request(app.getHttpServer()).post('/schools').send({ name: 'Greenwood High' }).expect(400);
    });
  });

  describe('GET /schools/:id', () => {
    it('returns 404 when the school does not exist', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer()).get('/schools/missing-id').expect(404);
    });

    it('returns the school when found', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue({ id: 'school-1', name: 'Greenwood High' });

      const response = await request(app.getHttpServer()).get('/schools/school-1').expect(200);

      expect(response.body.name).toBe('Greenwood High');
    });
  });

  describe('GET /schools', () => {
    it('rejects a request with neither organizationId nor districtId', async () => {
      await request(app.getHttpServer()).get('/schools').expect(400);
    });

    it('lists schools by organizationId', async () => {
      (schoolRepo.find as jest.Mock).mockResolvedValue([]);

      await request(app.getHttpServer()).get('/schools?organizationId=org-1').expect(200);

      expect(schoolRepo.find).toHaveBeenCalledWith({
        where: { organization: { id: 'org-1' } },
        order: { name: 'ASC' },
      });
    });
  });

  describe('GET /schools/:id/metrics', () => {
    it('returns 404 when the school does not exist', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer()).get('/schools/missing-id/metrics').expect(404);
    });
  });

  describe('PATCH /schools/:id/deactivate', () => {
    it('deactivates the school', async () => {
      (schoolRepo.update as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app.getHttpServer()).patch('/schools/school-1/deactivate').expect(200);

      expect(response.body).toEqual({ success: true });
      expect(schoolRepo.update).toHaveBeenCalledWith('school-1', { isActive: false });
    });
  });

  describe('districts', () => {
    it('creates a district', async () => {
      (districtRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (districtRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve({ id: 'district-1', ...entity }));

      await request(app.getHttpServer())
        .post('/schools/districts')
        .send({ name: 'Central', state: 'Karnataka' })
        .expect(201);
    });

    it('returns 404 for an unknown district', async () => {
      (districtRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer()).get('/schools/districts/missing-id').expect(404);
    });

    it('requires a state query parameter when listing districts', async () => {
      await request(app.getHttpServer()).get('/schools/districts').expect(400);
    });
  });
});
