import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SchoolScopeGuard } from 'src/common/guards/school-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('api/v2/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get()
  @UseGuards(SchoolScopeGuard)
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get attendance for a class on a given date' })
  async getByClass(
    @Query('schoolId') schoolId: string,
    @Query('gradeLevel') gradeLevel: string,
    @Query('classSection') classSection: string,
    @Query('date') date: string,
  ) {
    if (!schoolId || !gradeLevel || !classSection || !date) {
      throw new BadRequestException(
        'schoolId, gradeLevel, classSection and date query parameters are required',
      );
    }
    return this.attendanceService.getByClass(
      schoolId,
      parseInt(gradeLevel, 10),
      classSection,
      date,
    );
  }

  @Post('bulk')
  @UseGuards(SchoolScopeGuard)
  @HttpCode(HttpStatus.OK)
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Bulk mark attendance for a class' })
  async bulkMark(
    @Body()
    body: {
      schoolId: string;
      date: string;
      records: { studentId: string; status: string }[];
    },
  ) {
    return this.attendanceService.bulkMark(body.schoolId, body.date, body.records);
  }
}
