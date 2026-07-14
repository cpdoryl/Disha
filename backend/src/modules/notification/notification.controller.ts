import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationService } from '../../services/notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendAttendanceAlertDto } from './dto/send-attendance-alert.dto';
import { SendAcademicUpdateDto } from './dto/send-academic-update.dto';
import { SendFeeReminderDto } from './dto/send-fee-reminder.dto';
import { SendAssessmentInvitationDto } from './dto/send-assessment-invitation.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Send a general notification' })
  @ApiResponse({ status: 201 })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
  }

  @Post('attendance-alert')
  @ApiOperation({ summary: 'Send an attendance alert to a parent' })
  @ApiResponse({ status: 201 })
  async sendAttendanceAlert(@Body() dto: SendAttendanceAlertDto) {
    return this.notificationService.sendAttendanceAlert(
      dto.schoolId,
      dto.parentId,
      dto.studentName,
      dto.attendancePercentage,
      dto.studentId,
    );
  }

  @Post('academic-update')
  @ApiOperation({ summary: 'Send an academic performance update to a parent' })
  @ApiResponse({ status: 201 })
  async sendAcademicUpdateNotification(@Body() dto: SendAcademicUpdateDto) {
    return this.notificationService.sendAcademicUpdateNotification(
      dto.schoolId,
      dto.parentId,
      dto.studentName,
      dto.subject,
      dto.performance,
      dto.studentId,
    );
  }

  @Post('fee-reminder')
  @ApiOperation({ summary: 'Send a fee payment reminder to a parent' })
  @ApiResponse({ status: 201 })
  async sendFeeReminder(@Body() dto: SendFeeReminderDto) {
    return this.notificationService.sendFeeReminder(dto.schoolId, dto.parentId, dto.amount, new Date(dto.dueDate));
  }

  @Post('assessment-invitation')
  @ApiOperation({ summary: 'Invite a respondent to complete an assessment' })
  @ApiResponse({ status: 201 })
  async sendAssessmentInvitation(@Body() dto: SendAssessmentInvitationDto) {
    return this.notificationService.sendAssessmentInvitation(
      dto.schoolId,
      dto.respondentId,
      dto.assessmentName,
      new Date(dto.responseDeadline),
    );
  }

  @Get('preferences/:userId')
  @ApiOperation({ summary: "Get a parent's derived notification preferences" })
  @ApiResponse({ status: 200 })
  async getNotificationPreferences(@Param('userId') userId: string) {
    return this.notificationService.getNotificationPreferences(userId);
  }
}
