import { IsDateString, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendAssessmentInvitationDto {
  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty()
  @IsUUID()
  respondentId: string;

  @ApiProperty()
  @IsString()
  assessmentName: string;

  @ApiProperty()
  @IsDateString()
  responseDeadline: string;
}
