import { ArrayMinSize, IsArray, IsEnum, IsIn, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from 'src/services/reporting.service';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly'] as const;

export class ScheduleReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty({ enum: FREQUENCIES })
  @IsIn(FREQUENCIES)
  frequency: (typeof FREQUENCIES)[number];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  recipients: string[];
}
