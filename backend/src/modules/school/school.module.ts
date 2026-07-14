import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School, District, Organization } from 'src/database/entities';
import { SchoolService } from 'src/services/school.service';
import { SchoolController } from './school.controller';

@Module({
  imports: [TypeOrmModule.forFeature([School, District, Organization])],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
