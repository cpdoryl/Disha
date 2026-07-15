import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admission } from 'src/database/entities';

@Injectable()
export class AdmissionsService {
  constructor(
    @InjectRepository(Admission)
    private admissionRepository: Repository<Admission>,
  ) {}

  async getAdmissionsBySchool(schoolId: string): Promise<Admission[]> {
    return this.admissionRepository.find({
      where: { schoolId },
      order: { admissionDate: 'DESC' },
    });
  }
}
