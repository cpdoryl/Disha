import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounsellorReferral, RemediationIntervention, BullyingIncident, Student } from 'src/database/entities';
import { WellbeingService } from 'src/services/wellbeing.service';
import { WellbeingController } from './wellbeing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CounsellorReferral, RemediationIntervention, BullyingIncident, Student])],
  controllers: [WellbeingController],
  providers: [WellbeingService],
  exports: [WellbeingService],
})
export class WellbeingModule {}
