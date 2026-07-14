import { IsUUID, IsDate, IsNumber, IsArray, IsOptional } from 'class-validator';

export class ValidationErrorDto {
  questionId: string;
  error: string;
}

export class AssessmentResponseDto {
  @IsUUID()
  submissionId: string;

  @IsOptional()
  status: string;

  @IsOptional()
  @IsDate()
  timestamp: Date;

  @IsNumber()
  responsesReceived: number;

  @IsNumber()
  responsesRejected: number;

  @IsArray()
  validationErrors: ValidationErrorDto[];

  @IsOptional()
  receiptMessage: string;
}

export class CreateAssessmentDto {
  @IsUUID()
  schoolId: string;

  @IsOptional()
  cycleName?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;
}
