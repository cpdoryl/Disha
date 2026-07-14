import { ArrayMinSize, ArrayMaxSize, IsArray, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePriorityGapsDto {
  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty({ example: '2026' })
  @IsString()
  academicYear: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @IsUUID(4, { each: true })
  selectedChallengeIds: string[];
}
