import { IsUUID, IsArray, IsString, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RespondentType } from '../../../database/entities';

export class ResponseItemDto {
  @IsUUID()
  questionId: string;

  @IsString()
  responseValue: string; // Likert: "1"-"5", NPS: "0"-"10", etc.

  @IsOptional()
  @IsString()
  responseText?: string; // For open-ended questions
}

export class MetadataDto {
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  deviceType?: string; // web, mobile_ios, mobile_android

  @IsOptional()
  @IsString()
  deviceOs?: string;

  @IsOptional()
  @IsNumber()
  submissionTimeSeconds?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;
}

export class SubmitResponseDto {
  @IsUUID()
  assessmentId: string;

  @IsUUID()
  schoolId: string;

  @IsUUID()
  respondentId: string;

  @IsString()
  respondentType: RespondentType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseItemDto)
  responses: ResponseItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata?: MetadataDto;
}
