import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeLedger } from 'src/database/entities';
import { FeeService } from 'src/services/fee.service';
import { FeeController } from './fee.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeeLedger])],
  controllers: [FeeController],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}
