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

  async createStaff(createStaffDto: {
    schoolId: string;
    employeeId: string;
    firstName: string;
    lastName?: string;
    gender?: string;
    subjectTaught?: string;
    gradeLevel?: number;
    position: string;
    startDate: string;
    salaryBand?: string;
    trainingHoursPerYear?: number;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
  }): Promise<Staff> {
    const staff = this.staffRepository.create({
      ...createStaffDto,
      startDate: new Date(createStaffDto.startDate),
      dateOfBirth: createStaffDto.dateOfBirth ? new Date(createStaffDto.dateOfBirth) : undefined,
    } as Partial<Staff>);
    return this.staffRepository.save(staff);
  }

  async getStaff(staffId: string): Promise<Staff | null> {
    return this.staffRepository.findOne({ where: { id: staffId } });
  }

  async getStaffBySchool(schoolId: string): Promise<Staff[]> {
    return this.staffRepository.find({
      where: { schoolId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async updateEmploymentStatus(
    staffId: string,
    status: EmploymentStatus,
    exitReasonCode?: string,
    exitReasonDetail?: string,
  ): Promise<Staff | null> {
    const updateData: Partial<Staff> = { employmentStatus: status };
    if (status !== EmploymentStatus.ACTIVE) {
      updateData.exitDate = new Date();
      if (exitReasonCode) updateData.exitReasonCode = exitReasonCode;
      if (exitReasonDetail) updateData.exitReasonDetail = exitReasonDetail;
    }
    await this.staffRepository.update(staffId, updateData);
    return this.getStaff(staffId);
  }

  async getRetentionSummary(schoolId: string): Promise<{
    totalStaff: number;
    activeStaff: number;
    resignedStaff: number;
    retiredStaff: number;
    onLeaveStaff: number;
    retentionRate: number;
  }> {
    const staff = await this.staffRepository.find({ where: { schoolId } });
    const totalStaff = staff.length;
    const activeStaff = staff.filter((s) => s.employmentStatus === EmploymentStatus.ACTIVE).length;
    const resignedStaff = staff.filter((s) => s.employmentStatus === EmploymentStatus.RESIGNED).length;
    const retiredStaff = staff.filter((s) => s.employmentStatus === EmploymentStatus.RETIRED).length;
    const onLeaveStaff = staff.filter((s) => s.employmentStatus === EmploymentStatus.LEAVE).length;

    return {
      totalStaff,
      activeStaff,
      resignedStaff,
      retiredStaff,
      onLeaveStaff,
      retentionRate: totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 10000) / 100 : 0,
    };
  }
}
