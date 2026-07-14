import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSchoolDto } from './create-school.dto';

export class UpdateSchoolDto extends PartialType(OmitType(CreateSchoolDto, ['organizationId'] as const)) {}
