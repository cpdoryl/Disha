import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralSeverity } from 'src/database/entities';

export class CreateCounsellorReferralDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty()
  @IsString()
  reasonCode: string;

  @ApiProperty({ enum: ReferralSeverity })
  @IsEnum(ReferralSeverity)
  severity: ReferralSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referredBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  counsellingProvided?: boolean;
}
