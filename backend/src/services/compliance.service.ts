import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint, ComplaintCategory, ComplaintSeverity, DataRetentionPolicy } from 'src/database/entities';
// Imported directly: the barrel at 'src/database/entities' only re-exports the
// same-named ResolutionStatus enum from counsellorreferral.entity.ts, which
// would silently shadow this one.
import { ResolutionStatus } from 'src/database/entities/complaint.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    @InjectRepository(DataRetentionPolicy)
    private retentionPolicyRepository: Repository<DataRetentionPolicy>,
  ) {}

  async logComplaint(logDto: {
    schoolId: string;
    parentId?: string;
    complaintDate: string;
    category: ComplaintCategory;
    severity: ComplaintSeverity;
    complaintDescription: string;
  }): Promise<Complaint> {
    const complaint = this.complaintRepository.create({
      ...logDto,
      complaintDate: new Date(logDto.complaintDate),
      resolutionStatus: ResolutionStatus.PENDING,
    } as Partial<Complaint>);
    return this.complaintRepository.save(complaint);
  }

  async resolveComplaint(
    complaintId: string,
    resolutionMethod: string,
    resolutionNotes?: string,
    parentSatisfactionRating?: number,
  ): Promise<Complaint | null> {
    await this.complaintRepository.update(complaintId, {
      resolutionStatus: ResolutionStatus.RESOLVED,
      resolutionDate: new Date(),
      resolutionMethod,
      resolutionNotes,
      parentSatisfactionRating,
    });
    return this.complaintRepository.findOne({ where: { id: complaintId } });
  }

  async getComplaintsBySchool(schoolId: string, severity?: ComplaintSeverity): Promise<Complaint[]> {
    return this.complaintRepository.find({
      where: severity ? { schoolId, severity } : { schoolId },
      order: { complaintDate: 'DESC' },
    });
  }

  async getComplaintSummary(schoolId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    highSeverity: number;
    averageSatisfactionRating: number | null;
  }> {
    const complaints = await this.complaintRepository.find({ where: { schoolId } });
    const ratings = complaints
      .map((c) => c.parentSatisfactionRating)
      .filter((rating): rating is number => rating != null);

    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.resolutionStatus === ResolutionStatus.PENDING).length,
      inProgress: complaints.filter((c) => c.resolutionStatus === ResolutionStatus.IN_PROGRESS).length,
      resolved: complaints.filter((c) => c.resolutionStatus === ResolutionStatus.RESOLVED).length,
      highSeverity: complaints.filter((c) => c.severity === ComplaintSeverity.HIGH).length,
      averageSatisfactionRating:
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
          : null,
    };
  }

  async getDataRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    return this.retentionPolicyRepository.find({
      where: { isActive: true },
      order: { dataClassification: 'ASC' },
    });
  }
}
