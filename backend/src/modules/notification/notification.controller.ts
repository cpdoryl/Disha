import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NotificationService } from '../../services/notification.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v2/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ryl_admin', 'school_admin', 'teacher')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('me')
  @Roles('ryl_admin', 'school_admin', 'teacher', 'parent', 'student')
  async getMyNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.getMyNotifications(user.userId);
  }

  @Patch(':id/read')
  @Roles('ryl_admin', 'school_admin', 'teacher', 'parent', 'student')
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAsRead(id, user.userId);
  }

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendNotification(@Body() notificationDto: any) {
    return this.notificationService.sendNotification(notificationDto);
  }

  @Post('attendance-alert')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendAttendanceAlert(@Body() alertDto: any) {
    return this.notificationService.sendAttendanceAlert(
      alertDto.schoolId,
      alertDto.parentId,
      alertDto.studentName,
      alertDto.attendancePercentage,
    );
  }

  @Post('academic-update')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendAcademicUpdate(@Body() updateDto: any) {
    return this.notificationService.sendAcademicUpdateNotification(
      updateDto.schoolId,
      updateDto.parentId,
      updateDto.studentName,
      updateDto.subject,
      updateDto.performance,
    );
  }

  @Post('fee-reminder')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendFeeReminder(@Body() reminderDto: any) {
    return this.notificationService.sendFeeReminder(
      reminderDto.schoolId,
      reminderDto.parentId,
      reminderDto.amount,
      new Date(reminderDto.dueDate),
    );
  }

  @Post('assessment-invitation')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendAssessmentInvitation(@Body() invitationDto: any) {
    return this.notificationService.sendAssessmentInvitation(
      invitationDto.schoolId,
      invitationDto.respondentId,
      invitationDto.assessmentName,
      new Date(invitationDto.responseDeadline),
    );
  }

  @Get('preferences/:userId')
  async getNotificationPreferences(@Param('userId') userId: string) {
    return this.notificationService.getNotificationPreferences(userId);
  }
}
