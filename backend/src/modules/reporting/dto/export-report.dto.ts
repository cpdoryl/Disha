import { IsDefined, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from 'src/services/reporting.service';

export class ExportReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ type: Object, description: 'A flat record, or an array of flat records, to render as CSV' })
  @IsDefined()
  data: Record<string, any> | Record<string, any>[];
}
