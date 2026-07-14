import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School, Assessment, AssessmentResponse, Student } from '../database/entities';
import { ReportingService } from '../services/reporting.service';

@Module({
  imports: [TypeOrmModule.forFeature([School, Assessment, AssessmentResponse, Student])],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
