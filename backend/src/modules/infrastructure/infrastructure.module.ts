import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationalData } from 'src/database/entities';
import { InfrastructureService } from 'src/services/infrastructure.service';
import { InfrastructureController } from './infrastructure.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OperationalData])],
  controllers: [InfrastructureController],
  providers: [InfrastructureService],
  exports: [InfrastructureService],
})
export class InfrastructureModule {}
