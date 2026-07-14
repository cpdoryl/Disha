import { IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveBullyingIncidentDto {
  @ApiProperty()
  @IsDateString()
  resolutionDate: string;

  @ApiProperty()
  @IsString()
  resolutionNotes: string;
}
