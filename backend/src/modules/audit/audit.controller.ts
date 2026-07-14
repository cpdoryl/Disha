import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuditService } from '../../services/audit.service';

@Controller('api/v2/audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Post('log')
  @HttpCode(HttpStatus.CREATED)
  async logAction(@Body() auditDto: any) {
    return this.auditService.logAction(auditDto);
  }

  @Get('logs/school/:schoolId')
  async getAuditTrail(
    @Param('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.auditService.getAuditTrail(
      schoolId,
      new Date(startDate),
      new Date(endDate),
      resourceType as any,
    );
  }

  @Get('activity/user/:userId')
  async getUserActivityReport(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.getUserActivityReport(
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('failed-actions/school/:schoolId')
  async getFailedActions(
    @Param('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.getFailedActions(
      schoolId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('suspicious-activity/school/:schoolId')
  async getSuspiciousActivity(
    @Param('schoolId') schoolId: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.auditService.getSuspiciousActivity(
      schoolId,
      threshold || 10,
    );
  }
}
