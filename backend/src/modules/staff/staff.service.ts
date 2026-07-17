import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff, EmploymentStatus } from 'src/database/entities';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {}

  async createStaff(createStaffDto: {
    schoolId: string;
    employeeId: string;
    firstName: string;
    lastName?: string;
    gender?: string;
    subjectTaught?: string;
    gradeLevel?: number;
    position: string;
    startDate: Date;
    salaryBand?: string;
  }): Promise<Staff> {
    const staff = this.staffRepository.create({
      ...createStaffDto,
      employmentStatus: EmploymentStatus.ACTIVE,
    } as Partial<Staff>);
    return this.staffRepository.save(staff);
  }

  async getStaffBySchool(schoolId: string): Promise<Staff[]> {
    return this.staffRepository.find({
      where: { schoolId },
      order: { firstName: 'ASC' },
    });
  }

  async getStaff(staffId: string): Promise<Staff> {
    const staff = await this.staffRepository.findOne({ where: { id: staffId } });
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }
    return staff;
  }
}
