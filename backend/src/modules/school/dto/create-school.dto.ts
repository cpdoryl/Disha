import { IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CityTier, BoardType } from 'src/database/entities';

export class CreateSchoolDto {
  @ApiProperty()
  @IsUUID()
  organizationId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  district: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty({ enum: CityTier })
  @IsEnum(CityTier)
  cityTier: CityTier;

  @ApiProperty({ enum: BoardType })
  @IsEnum(BoardType)
  boardType: BoardType;

  @ApiProperty()
  @IsInt()
  @Min(0)
  studentCount: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  staffCount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  udiseCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  principalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  principalPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  principalEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}
