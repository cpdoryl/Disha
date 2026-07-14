import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendAttendanceAlertDto {
  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty()
  @IsUUID()
  parentId: string;

  @ApiProperty()
  @IsString()
  studentName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  attendancePercentage: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
