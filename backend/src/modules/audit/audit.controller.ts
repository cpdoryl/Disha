import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuditService } from '../../services/audit.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SchoolScopeGuard } from 'src/common/guards/school-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('api/v2/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ryl_admin', 'school_admin')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Post('log')
  @HttpCode(HttpStatus.CREATED)
  async logAction(@Body() auditDto: any) {
    return this.auditService.logAction(auditDto);
  }

  @Get('logs/school/:schoolId')
  @UseGuards(SchoolScopeGuard)
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
  @UseGuards(SchoolScopeGuard)
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
  @UseGuards(SchoolScopeGuard)
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
