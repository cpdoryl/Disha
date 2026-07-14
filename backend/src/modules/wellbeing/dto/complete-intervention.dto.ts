import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const EFFECTIVENESS_RATINGS = [1, 2, 3, 4, 5] as const;

export class CompleteInterventionDto {
  @ApiProperty({ enum: EFFECTIVENESS_RATINGS })
  @IsIn(EFFECTIVENESS_RATINGS)
  effectiveness: (typeof EFFECTIVENESS_RATINGS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
