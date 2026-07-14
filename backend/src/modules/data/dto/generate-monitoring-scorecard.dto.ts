import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScorecardMetric } from 'src/database/entities';

export class ScorecardMetricEntryDto {
  @ApiProperty({ enum: ScorecardMetric })
  @IsEnum(ScorecardMetric)
  metric: ScorecardMetric;

  @ApiProperty()
  @IsNumber()
  targetValue: number;

  @ApiProperty()
  @IsNumber()
  achievedValue: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  subMetrics?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  analysisNotes?: string;
}

export class GenerateMonitoringScorecardDto {
  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty()
  @IsDateString()
  month: string;

  @ApiProperty({ type: [ScorecardMetricEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScorecardMetricEntryDto)
  metrics: ScorecardMetricEntryDto[];
}
