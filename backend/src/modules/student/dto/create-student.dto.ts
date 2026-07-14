import { IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, AgeGroup } from 'src/database/entities/Student.entity';

export class CreateStudentDto {
  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty()
  @IsString()
  enrollmentNumber: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  gradeLevel: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classSection?: string;

  @ApiProperty({ enum: AgeGroup })
  @IsEnum(AgeGroup)
  ageGroup: AgeGroup;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  guardianEmail?: string;
}
