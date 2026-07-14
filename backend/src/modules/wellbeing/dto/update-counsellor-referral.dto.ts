import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ResolutionStatus } from 'src/database/entities';

export class UpdateCounsellorReferralDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  counsellingProvided?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sessionsCount?: number;

  @ApiPropertyOptional({ enum: ResolutionStatus })
  @IsOptional()
  @IsEnum(ResolutionStatus)
  resolutionStatus?: ResolutionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  resolutionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  outsideReferral?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalReferralTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  counsellorNotes?: string;
}
