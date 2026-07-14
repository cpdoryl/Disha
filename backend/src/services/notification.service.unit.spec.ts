import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService, NotificationType, NotificationChannel } from './notification.service';
import { ParentCommunication, CommunicationChannel, CommunicationStatus } from 'src/database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: MockRepo<ParentCommunication>;

  beforeEach(async () => {
    repo = createMockRepo<ParentCommunication>();
    (repo.create as jest.Mock).mockImplementation((entity) => entity);
    (repo.save as jest.Mock).mockImplementation((entity) => Promise.resolve({ id: 'comm-1', ...entity }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService, { provide: getRepositoryToken(ParentCommunication), useValue: repo }],
    }).compile();

    service = module.get(NotificationService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendNotification', () => {
    it('logs the notification as a pending parent communication', async () => {
      const result = await service.sendNotification({
        schoolId: 'school-1',
        parentId: 'parent-1',
        studentId: 'student-1',
        type: NotificationType.GENERAL_UPDATE,
        channel: NotificationChannel.EMAIL,
        message: 'Report card is ready.',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolId: 'school-1',
          parentId: 'parent-1',
          studentId: 'student-1',
          queryChannel: CommunicationChannel.EMAIL,
          queryTopic: NotificationType.GENERAL_UPDATE,
          queryDescription: 'Report card is ready.',
          status: CommunicationStatus.PENDING,
        }),
      );
      expect(result).toEqual({ success: true, channels: [CommunicationChannel.EMAIL], communicationId: 'comm-1' });
    });
  });

  describe('sendAttendanceAlert', () => {
    it('logs an SMS attendance alert with the percentage in the message', async () => {
      await service.sendAttendanceAlert('school-1', 'parent-1', 'Asha Rao', 72);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          queryChannel: CommunicationChannel.SMS,
          queryTopic: NotificationType.ATTENDANCE_ALERT,
          queryDescription: expect.stringContaining('72%'),
        }),
      );
    });
  });

  describe('sendAcademicUpdateNotification', () => {
    it('logs an email academic update', async () => {
      await service.sendAcademicUpdateNotification('school-1', 'parent-1', 'Asha Rao', 'Math', 'improving');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          queryChannel: CommunicationChannel.EMAIL,
          queryTopic: NotificationType.ACADEMIC_PERFORMANCE,
          queryDescription: expect.stringContaining('Math'),
        }),
      );
    });
  });

  describe('sendFeeReminder', () => {
    it('logs a fee reminder with the due date', async () => {
      await service.sendFeeReminder('school-1', 'parent-1', 5000, new Date('2026-04-01'));

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          queryTopic: NotificationType.FEE_REMINDER,
          queryDescription: expect.stringContaining('5000'),
        }),
      );
    });
  });

  describe('sendAssessmentInvitation', () => {
    it('logs a WhatsApp assessment invitation', async () => {
      await service.sendAssessmentInvitation('school-1', 'respondent-1', 'Term1_2026', new Date('2026-05-01'));

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          queryChannel: CommunicationChannel.WHATSAPP,
          queryTopic: NotificationType.ASSESSMENT_INVITATION,
          parentId: 'respondent-1',
        }),
      );
    });
  });

  describe('getNotificationPreferences', () => {
    it('derives preferred channels and topics from communication history', async () => {
      (repo.find as jest.Mock).mockResolvedValue([
        { queryChannel: CommunicationChannel.SMS, queryTopic: 'attendance_alert' },
        { queryChannel: CommunicationChannel.SMS, queryTopic: 'fee_reminder' },
        { queryChannel: CommunicationChannel.EMAIL, queryTopic: 'attendance_alert' },
      ]);

      const preferences = await service.getNotificationPreferences('parent-1');

      expect(preferences.preferredChannels[0]).toBe(CommunicationChannel.SMS);
      expect(preferences.notificationTypes.sort()).toEqual(['attendance_alert', 'fee_reminder']);
    });

    it('returns empty preferences when there is no history', async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);

      const preferences = await service.getNotificationPreferences('parent-1');

      expect(preferences).toEqual({ preferredChannels: [], notificationTypes: [] });
    });
  });
});
