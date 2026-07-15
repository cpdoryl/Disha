import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admission } from 'src/database/entities';
import { AdmissionsService } from 'src/services/admissions.service';
import { AdmissionsController } from './admissions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Admission])],
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
