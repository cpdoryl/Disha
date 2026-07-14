import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SchoolService } from './school.service';
import { School, District, Organization, CityTier, BoardType } from 'src/database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('SchoolService', () => {
  let service: SchoolService;
  let schoolRepo: MockRepo<School>;
  let districtRepo: MockRepo<District>;
  let organizationRepo: MockRepo<Organization>;

  beforeEach(async () => {
    schoolRepo = createMockRepo<School>();
    districtRepo = createMockRepo<District>();
    organizationRepo = createMockRepo<Organization>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolService,
        { provide: getRepositoryToken(School), useValue: schoolRepo },
        { provide: getRepositoryToken(District), useValue: districtRepo },
        { provide: getRepositoryToken(Organization), useValue: organizationRepo },
      ],
    }).compile();

    service = module.get(SchoolService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createSchool', () => {
    it('links the school to its organization and sets onboarding defaults', async () => {
      const dto = {
        organizationId: 'org-1',
        name: 'Greenwood High',
        district: 'Central',
        state: 'Karnataka',
        city: 'Bengaluru',
        cityTier: CityTier.TIER_1,
        boardType: BoardType.CBSE,
        studentCount: 500,
        staffCount: 40,
      };
      (schoolRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (schoolRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve({ id: 'school-1', ...entity }));

      const result = await service.createSchool(dto);

      expect(schoolRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Greenwood High',
          organization: { id: 'org-1' },
          isActive: true,
        }),
      );
      expect(result.id).toBe('school-1');
    });
  });

  describe('getSchool', () => {
    it('loads the school with its core relations', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue(null);

      await service.getSchool('school-1');

      expect(schoolRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'school-1' },
        relations: ['organization', 'assessments', 'students', 'staff'],
      });
    });

    it('returns null when the school does not exist', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getSchool('missing');

      expect(result).toBeNull();
    });
  });

  describe('updateSchool', () => {
    it('applies the update then returns the refreshed school', async () => {
      const updated = { id: 'school-1', name: 'New Name' } as School;
      (schoolRepo.update as jest.Mock).mockResolvedValue(undefined);
      (schoolRepo.findOne as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateSchool('school-1', { name: 'New Name' });

      expect(schoolRepo.update).toHaveBeenCalledWith('school-1', { name: 'New Name' });
      expect(result).toEqual(updated);
    });
  });

  describe('getSchoolsByOrganization', () => {
    it('filters by organization id, ordered by name', async () => {
      (schoolRepo.find as jest.Mock).mockResolvedValue([]);

      await service.getSchoolsByOrganization('org-1');

      expect(schoolRepo.find).toHaveBeenCalledWith({
        where: { organization: { id: 'org-1' } },
        order: { name: 'ASC' },
      });
    });
  });

  describe('getSchoolMetrics', () => {
    it('returns null when the school does not exist', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getSchoolMetrics('missing');

      expect(result).toBeNull();
    });

    it('returns student/staff counts from the school record', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue({ studentCount: 500, staffCount: 40 } as School);

      const result = await service.getSchoolMetrics('school-1');

      expect(result).toEqual({
        studentCount: 500,
        staffCount: 40,
        activeAssessments: 0,
        pendingAssessments: 0,
      });
    });
  });

  describe('deactivateSchool', () => {
    it('sets isActive to false', async () => {
      (schoolRepo.update as jest.Mock).mockResolvedValue(undefined);

      await service.deactivateSchool('school-1');

      expect(schoolRepo.update).toHaveBeenCalledWith('school-1', { isActive: false });
    });
  });

  describe('createDistrict', () => {
    it('creates and saves a district', async () => {
      const dto = { name: 'Central', state: 'Karnataka' };
      (districtRepo.create as jest.Mock).mockReturnValue(dto);
      (districtRepo.save as jest.Mock).mockResolvedValue({ id: 'district-1', ...dto });

      const result = await service.createDistrict(dto);

      expect(districtRepo.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('district-1');
    });
  });

  describe('getDistrictsByState', () => {
    it('filters by state, ordered by name', async () => {
      (districtRepo.find as jest.Mock).mockResolvedValue([]);

      await service.getDistrictsByState('Karnataka');

      expect(districtRepo.find).toHaveBeenCalledWith({
        where: { state: 'Karnataka' },
        order: { name: 'ASC' },
      });
    });
  });
});
