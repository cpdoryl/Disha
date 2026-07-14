import { IsDateString, IsInt, IsNotEmptyObject, IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataType } from 'src/database/entities';

export class RecordOperationalDataDto {
  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty({ enum: DataType })
  @IsEnum(DataType)
  dataType: DataType;

  @ApiProperty()
  @IsDateString()
  dataDate: string;

  @ApiProperty({ type: Object })
  @IsNotEmptyObject()
  dataValue: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}
