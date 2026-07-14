import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from 'src/database/entities/studentattendance.entity';

export class RecordAttendanceDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty()
  @IsDateString()
  attendanceDate: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  term?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  markedByStaffId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
