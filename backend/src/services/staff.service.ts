import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff, EmploymentStatus } from 'src/database/entities';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {}

  async getStaffBySchool(schoolId: string): Promise<Staff[]> {
    return this.staffRepository.find({
      where: { schoolId, employmentStatus: EmploymentStatus.ACTIVE },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }
}
