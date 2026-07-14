import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ASSESSMENT_TYPES = ['quiz', 'midterm', 'final', 'project'] as const;

export class RecordAcademicAssessmentDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty()
  @IsDateString()
  assessmentDate: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  topic: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  scoreObtained: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  scoreMax: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  gradeLevelExpectation: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  term?: string;

  @ApiPropertyOptional({ enum: ASSESSMENT_TYPES })
  @IsOptional()
  @IsIn(ASSESSMENT_TYPES)
  assessmentType?: (typeof ASSESSMENT_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherNotes?: string;
}
