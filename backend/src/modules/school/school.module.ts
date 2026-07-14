import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School, District, Organization } from 'src/database/entities';
import { SchoolService } from 'src/services/school.service';

@Module({
  imports: [TypeOrmModule.forFeature([School, District, Organization])],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
