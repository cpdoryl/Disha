import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admission, AdmissionStatus, AdmissionSource } from 'src/database/entities';

@Injectable()
export class AdmissionsService {
  constructor(
    @InjectRepository(Admission)
    private admissionRepository: Repository<Admission>,
  ) {}

  async createAdmission(createAdmissionDto: {
    schoolId: string;
    studentName: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    dateOfBirth: string;
    gradeApplied: number;
    admissionDate: string;
    sourceOfInquiry: AdmissionSource;
    remarks?: string;
  }): Promise<Admission> {
    const admission = this.admissionRepository.create({
      ...createAdmissionDto,
      dateOfBirth: new Date(createAdmissionDto.dateOfBirth),
      admissionDate: new Date(createAdmissionDto.admissionDate),
      status: AdmissionStatus.INQUIRY,
    } as Partial<Admission>);
    return this.admissionRepository.save(admission);
  }

  async getAdmission(admissionId: string): Promise<Admission | null> {
    return this.admissionRepository.findOne({ where: { id: admissionId } });
  }

  async getAdmissionsBySchool(schoolId: string, status?: AdmissionStatus): Promise<Admission[]> {
    return this.admissionRepository.find({
      where: status ? { schoolId, status } : { schoolId },
      order: { admissionDate: 'DESC' },
    });
  }

  async updateStatus(
    admissionId: string,
    status: AdmissionStatus,
    extra?: { interviewDate?: string; interviewScore?: number },
  ): Promise<Admission | null> {
    const updateData: Partial<Admission> = { status };
    if (status === AdmissionStatus.INTERVIEWED && extra?.interviewDate) {
      updateData.interviewDate = new Date(extra.interviewDate);
      updateData.interviewScore = extra.interviewScore;
    }
    if (status === AdmissionStatus.OFFERED) {
      updateData.admissionOfferDate = new Date();
    }
    if (status === AdmissionStatus.ADMITTED) {
      updateData.admissionAcceptanceDate = new Date();
    }
    await this.admissionRepository.update(admissionId, updateData);
    return this.getAdmission(admissionId);
  }

  async getFunnelSummary(schoolId: string): Promise<Record<AdmissionStatus, number>> {
    const admissions = await this.admissionRepository.find({ where: { schoolId } });
    const summary = Object.values(AdmissionStatus).reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<AdmissionStatus, number>,
    );
    for (const admission of admissions) {
      summary[admission.status] += 1;
    }
    return summary;
  }
}
