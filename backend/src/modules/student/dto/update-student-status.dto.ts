import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudentStatus } from 'src/database/entities';

export class UpdateStudentStatusDto {
  @ApiProperty({ enum: StudentStatus })
  @IsEnum(StudentStatus)
  status: StudentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
