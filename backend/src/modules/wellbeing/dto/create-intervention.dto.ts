import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterventionType } from 'src/database/entities';

export class CreateInterventionDto {
  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: InterventionType })
  @IsEnum(InterventionType)
  interventionType: InterventionType;

  @ApiProperty()
  @IsDateString()
  interventionStartDate: string;

  @ApiProperty()
  @IsString()
  interventionDetails: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;
}
