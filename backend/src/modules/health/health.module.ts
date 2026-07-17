import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrometheusMetricsController } from './prometheus-metrics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [HealthController, PrometheusMetricsController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
