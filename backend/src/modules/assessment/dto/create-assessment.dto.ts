import { IsUUID, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAssessmentDto {
  @IsUUID()
  schoolId: string;

  @IsString()
  cycleName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
