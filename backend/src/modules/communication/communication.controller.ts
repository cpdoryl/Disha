import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CommunicationService } from 'src/services/communication.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CommunicationStatus } from 'src/database/entities';
import { CurrentUser, AuthenticatedUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Communication')
@ApiBearerAuth()
@Controller('api/v2/communication')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationController {
  constructor(private communicationService: CommunicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Log a parent communication/query' })
  async logCommunication(@Body() logDto: any) {
    return this.communicationService.logCommunication(logDto);
  }

  @Patch(':id/respond')
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Communication ID' })
  @ApiOperation({ summary: 'Record a response to a communication' })
  async respond(@Param('id') id: string, @Body() body: { responseContent: string }) {
    return this.communicationService.respond(id, body.responseContent);
  }

  @Get('school/:schoolId')
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiQuery({ name: 'status', required: false, enum: CommunicationStatus })
  @ApiOperation({ summary: 'Get communications by school' })
  async getBySchool(@Param('schoolId') schoolId: string, @Query('status') status?: CommunicationStatus) {
    return this.communicationService.getBySchool(schoolId, status);
  }

  @Get('me')
  @Roles('parent')
  @ApiOperation({ summary: "Get the logged-in parent's own communications" })
  async getMyCommunications(@CurrentUser() user: AuthenticatedUser) {
    return this.communicationService.getByParent(user.userId);
  }

  @Get('student/:studentId')
  @Roles('ryl_admin', 'school_admin', 'teacher', 'parent')
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiOperation({ summary: 'Get communications for a student' })
  async getByStudent(@Param('studentId') studentId: string) {
    return this.communicationService.getByStudent(studentId);
  }

  @Get('school/:schoolId/metrics')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get response time metrics for a school' })
  async getResponseMetrics(@Param('schoolId') schoolId: string) {
    return this.communicationService.getResponseMetrics(schoolId);
  }
}
