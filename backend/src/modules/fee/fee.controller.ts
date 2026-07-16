import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FeeService } from 'src/services/fee.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FeeStatus, PaymentMethod } from 'src/database/entities';

@ApiTags('Fee')
@ApiBearerAuth()
@Controller('api/v2/fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeController {
  constructor(private feeService: FeeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Create a fee ledger entry for a student' })
  async createFeeEntry(@Body() createFeeDto: any) {
    return this.feeService.createFeeEntry(createFeeDto);
  }

  @Patch(':id/payment')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'Fee ledger entry ID' })
  @ApiOperation({ summary: 'Record a payment against a fee ledger entry' })
  async recordPayment(
    @Param('id') id: string,
    @Body() body: { paidAmount: number; paymentMethod: PaymentMethod; paymentReference?: string },
  ) {
    return this.feeService.recordPayment(id, body.paidAmount, body.paymentMethod, body.paymentReference);
  }

  @Get('school/:schoolId')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiQuery({ name: 'status', required: false, enum: FeeStatus })
  @ApiOperation({ summary: 'Get fee ledger for a school' })
  async getFeeLedgerBySchool(@Param('schoolId') schoolId: string, @Query('status') status?: FeeStatus) {
    return this.feeService.getFeeLedgerBySchool(schoolId, status);
  }

  @Get('student/:studentId')
  @Roles('ryl_admin', 'school_admin', 'parent')
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiOperation({ summary: 'Get fee ledger for a student' })
  async getFeeLedgerByStudent(@Param('studentId') studentId: string) {
    return this.feeService.getFeeLedgerByStudent(studentId);
  }

  @Get('school/:schoolId/summary')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get fee collection summary for a school' })
  async getCollectionSummary(@Param('schoolId') schoolId: string) {
    return this.feeService.getCollectionSummary(schoolId);
  }
}
