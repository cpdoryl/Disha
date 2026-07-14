import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WellbeingService, WellbeingRiskLevel } from './wellbeing.service';
import {
  CounsellorReferral,
  ReferralSeverity,
  ResolutionStatus,
  RemediationIntervention,
  InterventionStatus,
  InterventionType,
  BullyingIncident,
  IncidentSeverity,
  IncidentType,
  Student,
} from 'src/database/entities';
import { ResolutionStatus as BullyingResolutionStatus } from 'src/database/entities/bullyingincident.entity';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('WellbeingService', () => {
  let service: WellbeingService;
  let counsellorRepo: MockRepo<CounsellorReferral>;
  let interventionRepo: MockRepo<RemediationIntervention>;
  let bullyingRepo: MockRepo<BullyingIncident>;
  let studentRepo: MockRepo<Student>;

  beforeEach(async () => {
    counsellorRepo = createMockRepo<CounsellorReferral>();
    interventionRepo = createMockRepo<RemediationIntervention>();
    bullyingRepo = createMockRepo<BullyingIncident>();
    studentRepo = createMockRepo<Student>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WellbeingService,
        { provide: getRepositoryToken(CounsellorReferral), useValue: counsellorRepo },
        { provide: getRepositoryToken(RemediationIntervention), useValue: interventionRepo },
        { provide: getRepositoryToken(BullyingIncident), useValue: bullyingRepo },
        { provide: getRepositoryToken(Student), useValue: studentRepo },
      ],
    }).compile();

    service = module.get(WellbeingService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('assessStudentWellbeing', () => {
    it('throws NotFoundException when the student does not exist', async () => {
      (studentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.assessStudentWellbeing('missing')).rejects.toThrow(NotFoundException);
    });

    it('flags CRITICAL risk for an open critical-severity referral', async () => {
      (studentRepo.findOne as jest.Mock).mockResolvedValue({ id: 'student-1', schoolId: 'school-1' });
      (counsellorRepo.find as jest.Mock).mockResolvedValue([
        { severity: ReferralSeverity.CRITICAL, resolutionStatus: ResolutionStatus.ONGOING },
      ]);
      (interventionRepo.find as jest.Mock).mockResolvedValue([]);
      (bullyingRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.assessStudentWellbeing('student-1');

      expect(result.riskLevel).toBe(WellbeingRiskLevel.CRITICAL);
      expect(result.openCounsellorReferrals).toBe(1);
    });

    it('flags HIGH risk for an unresolved bullying incident involving the student', async () => {
      (studentRepo.findOne as jest.Mock).mockResolvedValue({ id: 'student-1', schoolId: 'school-1' });
      (counsellorRepo.find as jest.Mock).mockResolvedValue([]);
      (interventionRepo.find as jest.Mock).mockResolvedValue([]);
      (bullyingRepo.find as jest.Mock).mockResolvedValue([
        {
          severity: IncidentSeverity.MODERATE,
          resolutionStatus: BullyingResolutionStatus.PENDING,
          studentIds: ['student-1'],
        },
      ]);

      const result = await service.assessStudentWellbeing('student-1');

      expect(result.riskLevel).toBe(WellbeingRiskLevel.HIGH);
      expect(result.bullyingIncidentsInvolved).toBe(1);
    });

    it('reports LOW risk when there is no open concern', async () => {
      (studentRepo.findOne as jest.Mock).mockResolvedValue({ id: 'student-1', schoolId: 'school-1' });
      (counsellorRepo.find as jest.Mock).mockResolvedValue([
        { severity: ReferralSeverity.LOW, resolutionStatus: ResolutionStatus.RESOLVED },
      ]);
      (interventionRepo.find as jest.Mock).mockResolvedValue([]);
      (bullyingRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.assessStudentWellbeing('student-1');

      expect(result.riskLevel).toBe(WellbeingRiskLevel.LOW);
    });
  });

  describe('createCounsellorReferral', () => {
    it('opens the referral as ONGOING', async () => {
      (counsellorRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (counsellorRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.createCounsellorReferral({
        studentId: 'student-1',
        schoolId: 'school-1',
        reasonCode: 'anxiety',
        severity: ReferralSeverity.HIGH,
      });

      expect(result.resolutionStatus).toBe(ResolutionStatus.ONGOING);
      expect(result.referralDate).toBeInstanceOf(Date);
    });
  });

  describe('updateCounsellorReferral', () => {
    it('throws NotFoundException when the referral does not exist', async () => {
      (counsellorRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateCounsellorReferral('missing', {})).rejects.toThrow(NotFoundException);
    });

    it('merges the update into the existing referral', async () => {
      const referral = { id: 'referral-1', sessionsCount: 1 };
      (counsellorRepo.findOne as jest.Mock).mockResolvedValue(referral);
      (counsellorRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateCounsellorReferral('referral-1', { sessionsCount: 2 });

      expect(result.sessionsCount).toBe(2);
    });
  });

  describe('createIntervention', () => {
    it('creates the intervention as PLANNED', async () => {
      (interventionRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (interventionRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.createIntervention({
        schoolId: 'school-1',
        studentId: 'student-1',
        interventionType: InterventionType.COUNSELLING,
        interventionStartDate: new Date('2026-02-01'),
        interventionDetails: 'Weekly counselling sessions',
      });

      expect(result.status).toBe(InterventionStatus.PLANNED);
    });
  });

  describe('completeIntervention', () => {
    it('throws NotFoundException when the intervention does not exist', async () => {
      (interventionRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.completeIntervention('missing', 4)).rejects.toThrow(NotFoundException);
    });

    it('marks the intervention completed with an effectiveness rating', async () => {
      const intervention = { id: 'intervention-1', status: InterventionStatus.ACTIVE };
      (interventionRepo.findOne as jest.Mock).mockResolvedValue(intervention);
      (interventionRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.completeIntervention('intervention-1', 5, 'Significant improvement');

      expect(result.status).toBe(InterventionStatus.COMPLETED);
      expect(result.effectivenessRating).toBe(5);
      expect(result.actualEndDate).toBeInstanceOf(Date);
      expect(result.progressNotes).toBe('Significant improvement');
    });
  });

  describe('recordBullyingIncident', () => {
    it('records the incident as PENDING resolution', async () => {
      (bullyingRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (bullyingRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.recordBullyingIncident({
        schoolId: 'school-1',
        incidentDate: new Date('2026-02-10'),
        incidentType: IncidentType.IN_PERSON,
        severity: IncidentSeverity.MODERATE,
        studentsInvolved: 2,
        actionTaken: 'Counselling scheduled',
      });

      expect(result.resolutionStatus).toBe(BullyingResolutionStatus.PENDING);
    });
  });

  describe('resolveBullyingIncident', () => {
    it('throws NotFoundException when the incident does not exist', async () => {
      (bullyingRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.resolveBullyingIncident('missing', new Date(), 'resolved')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('marks the incident resolved with notes', async () => {
      (bullyingRepo.findOne as jest.Mock).mockResolvedValue({ id: 'incident-1' });
      (bullyingRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const resolutionDate = new Date('2026-03-01');
      const result = await service.resolveBullyingIncident('incident-1', resolutionDate, 'Mediated and resolved');

      expect(result.resolutionStatus).toBe(BullyingResolutionStatus.RESOLVED);
      expect(result.resolutionDate).toBe(resolutionDate);
      expect(result.principalNotes).toBe('Mediated and resolved');
    });
  });

  describe('getSchoolWellbeingDashboard', () => {
    it('aggregates referrals, interventions, and incidents for the school', async () => {
      (counsellorRepo.find as jest.Mock).mockResolvedValue([
        { severity: ReferralSeverity.HIGH, resolutionStatus: ResolutionStatus.ONGOING },
        { severity: ReferralSeverity.LOW, resolutionStatus: ResolutionStatus.RESOLVED },
      ]);
      (interventionRepo.find as jest.Mock).mockResolvedValue([
        { status: InterventionStatus.ACTIVE },
        { status: InterventionStatus.COMPLETED },
      ]);
      (bullyingRepo.find as jest.Mock).mockResolvedValue([
        { severity: IncidentSeverity.SEVERE, resolutionStatus: BullyingResolutionStatus.PENDING },
        { severity: IncidentSeverity.MINOR, resolutionStatus: BullyingResolutionStatus.RESOLVED },
      ]);

      const dashboard = await service.getSchoolWellbeingDashboard('school-1');

      expect(dashboard.referrals).toEqual({
        total: 2,
        bySeverity: { high: 1, low: 1 },
        open: 1,
      });
      expect(dashboard.interventions).toEqual({ total: 2, byStatus: { active: 1, completed: 1 } });
      expect(dashboard.bullyingIncidents).toEqual({
        total: 2,
        unresolved: 1,
        bySeverity: { severe: 1, minor: 1 },
      });
    });
  });

  describe('getInterventionEffectivenessReport', () => {
    it('averages effectiveness across completed interventions, grouped by type', async () => {
      (interventionRepo.find as jest.Mock).mockImplementation(({ where }) => {
        if (where.status === InterventionStatus.COMPLETED) {
          return Promise.resolve([
            { interventionType: InterventionType.COUNSELLING, effectivenessRating: 4 },
            { interventionType: InterventionType.COUNSELLING, effectivenessRating: 2 },
            { interventionType: InterventionType.ACADEMIC_SUPPORT, effectivenessRating: 5 },
          ]);
        }
        return Promise.resolve([
          { status: InterventionStatus.COMPLETED },
          { status: InterventionStatus.COMPLETED },
          { status: InterventionStatus.COMPLETED },
          { status: InterventionStatus.ABANDONED },
        ]);
      });

      const report = await service.getInterventionEffectivenessReport('school-1');

      expect(report.completedInterventions).toBe(3);
      expect(report.averageEffectiveness).toBe('3.7');
      expect(report.byInterventionType[InterventionType.COUNSELLING]).toEqual({
        count: 2,
        averageEffectiveness: '3.0',
      });
      expect(report.byStatus).toEqual({ completed: 3, abandoned: 1 });
    });

    it('returns null average effectiveness when nothing is completed yet', async () => {
      (interventionRepo.find as jest.Mock).mockResolvedValue([]);

      const report = await service.getInterventionEffectivenessReport('school-1');

      expect(report.averageEffectiveness).toBeNull();
      expect(report.completedInterventions).toBe(0);
    });
  });
});
