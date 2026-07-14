import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDistrictDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  districtCode?: string;
}
