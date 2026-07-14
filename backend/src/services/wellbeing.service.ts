import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import {
  CounsellorReferral,
  ReferralSeverity,
  ResolutionStatus,
  RemediationIntervention,
  InterventionStatus,
  InterventionType,
  BullyingIncident,
  IncidentSeverity,
  Student,
} from 'src/database/entities';
import { ResolutionStatus as BullyingResolutionStatus } from 'src/database/entities/bullyingincident.entity';

export enum WellbeingRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Injectable()
export class WellbeingService {
  constructor(
    @InjectRepository(CounsellorReferral)
    private counsellorRepository: Repository<CounsellorReferral>,
    @InjectRepository(RemediationIntervention)
    private interventionRepository: Repository<RemediationIntervention>,
    @InjectRepository(BullyingIncident)
    private bullyingRepository: Repository<BullyingIncident>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async assessStudentWellbeing(studentId: string): Promise<{
    studentId: string;
    riskLevel: WellbeingRiskLevel;
    openCounsellorReferrals: number;
    activeInterventions: number;
    bullyingIncidentsInvolved: number;
  }> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const [referrals, interventions, schoolIncidents] = await Promise.all([
      this.counsellorRepository.find({ where: { studentId } }),
      this.interventionRepository.find({ where: { studentId } }),
      this.bullyingRepository.find({ where: { schoolId: student.schoolId } }),
    ]);

    const openReferrals = referrals.filter((r) => r.resolutionStatus === ResolutionStatus.ONGOING);
    const activeInterventions = interventions.filter((i) => i.status === InterventionStatus.ACTIVE);
    const incidentsInvolved = schoolIncidents.filter((incident) => incident.studentIds?.includes(studentId));
    const unresolvedIncidents = incidentsInvolved.filter(
      (incident) => incident.resolutionStatus !== BullyingResolutionStatus.RESOLVED,
    );

    let riskLevel = WellbeingRiskLevel.LOW;
    if (
      openReferrals.some((r) => r.severity === ReferralSeverity.CRITICAL) ||
      unresolvedIncidents.some((i) => i.severity === IncidentSeverity.SEVERE)
    ) {
      riskLevel = WellbeingRiskLevel.CRITICAL;
    } else if (openReferrals.some((r) => r.severity === ReferralSeverity.HIGH) || unresolvedIncidents.length > 0) {
      riskLevel = WellbeingRiskLevel.HIGH;
    } else if (openReferrals.some((r) => r.severity === ReferralSeverity.MEDIUM)) {
      riskLevel = WellbeingRiskLevel.MEDIUM;
    }

    return {
      studentId,
      riskLevel,
      openCounsellorReferrals: openReferrals.length,
      activeInterventions: activeInterventions.length,
      bullyingIncidentsInvolved: incidentsInvolved.length,
    };
  }

  async createCounsellorReferral(referralDto: {
    studentId: string;
    schoolId: string;
    reasonCode: string;
    severity: ReferralSeverity;
    referredBy?: string;
    counsellingProvided?: boolean;
  }): Promise<CounsellorReferral> {
    const referral = this.counsellorRepository.create({
      ...referralDto,
      referralDate: new Date(),
      resolutionStatus: ResolutionStatus.ONGOING,
    });
    return this.counsellorRepository.save(referral);
  }

  async updateCounsellorReferral(
    referralId: string,
    updateDto: Partial<CounsellorReferral>,
  ): Promise<CounsellorReferral> {
    const referral = await this.counsellorRepository.findOne({ where: { id: referralId } });
    if (!referral) {
      throw new NotFoundException(`Counsellor referral ${referralId} not found`);
    }
    Object.assign(referral, updateDto);
    return this.counsellorRepository.save(referral);
  }

  async createIntervention(interventionDto: {
    schoolId: string;
    studentId: string;
    interventionType: InterventionType;
    interventionStartDate: Date;
    interventionDetails: string;
    plannedEndDate?: Date;
    assignedTo?: string;
  }): Promise<RemediationIntervention> {
    const intervention = this.interventionRepository.create({
      ...interventionDto,
      status: InterventionStatus.PLANNED,
    });
    return this.interventionRepository.save(intervention);
  }

  async completeIntervention(
    interventionId: string,
    effectiveness: 1 | 2 | 3 | 4 | 5,
    notes?: string,
  ): Promise<RemediationIntervention> {
    const intervention = await this.interventionRepository.findOne({ where: { id: interventionId } });
    if (!intervention) {
      throw new NotFoundException(`Intervention ${interventionId} not found`);
    }

    intervention.status = InterventionStatus.COMPLETED;
    intervention.actualEndDate = new Date();
    intervention.effectivenessRating = effectiveness;
    if (notes) {
      intervention.progressNotes = notes;
    }

    return this.interventionRepository.save(intervention);
  }

  async recordBullyingIncident(incidentDto: {
    schoolId: string;
    incidentDate: Date;
    incidentType: BullyingIncident['incidentType'];
    severity: IncidentSeverity;
    studentsInvolved: number;
    actionTaken: string;
    studentIds?: string[];
    reportedBy?: string;
    parentNotified?: boolean;
  }): Promise<BullyingIncident> {
    const incident = this.bullyingRepository.create({
      ...incidentDto,
      resolutionStatus: BullyingResolutionStatus.PENDING,
    });
    return this.bullyingRepository.save(incident);
  }

  async resolveBullyingIncident(
    incidentId: string,
    resolutionDate: Date,
    resolutionNotes: string,
  ): Promise<BullyingIncident> {
    const incident = await this.bullyingRepository.findOne({ where: { id: incidentId } });
    if (!incident) {
      throw new NotFoundException(`Bullying incident ${incidentId} not found`);
    }

    incident.resolutionStatus = BullyingResolutionStatus.RESOLVED;
    incident.resolutionDate = resolutionDate;
    incident.principalNotes = resolutionNotes;

    return this.bullyingRepository.save(incident);
  }

  async getSchoolWellbeingDashboard(schoolId: string): Promise<{
    referrals: { total: number; bySeverity: Record<string, number>; open: number };
    interventions: { total: number; byStatus: Record<string, number> };
    bullyingIncidents: { total: number; unresolved: number; bySeverity: Record<string, number> };
  }> {
    const [referrals, interventions, incidents] = await Promise.all([
      this.counsellorRepository.find({ where: { schoolId } }),
      this.interventionRepository.find({ where: { schoolId } }),
      this.bullyingRepository.find({ where: { schoolId } }),
    ]);

    const referralsBySeverity: Record<string, number> = {};
    referrals.forEach((r) => {
      referralsBySeverity[r.severity] = (referralsBySeverity[r.severity] || 0) + 1;
    });

    const interventionsByStatus: Record<string, number> = {};
    interventions.forEach((i) => {
      interventionsByStatus[i.status] = (interventionsByStatus[i.status] || 0) + 1;
    });

    const incidentsBySeverity: Record<string, number> = {};
    incidents.forEach((i) => {
      incidentsBySeverity[i.severity] = (incidentsBySeverity[i.severity] || 0) + 1;
    });

    return {
      referrals: {
        total: referrals.length,
        bySeverity: referralsBySeverity,
        open: referrals.filter((r) => r.resolutionStatus === ResolutionStatus.ONGOING).length,
      },
      interventions: {
        total: interventions.length,
        byStatus: interventionsByStatus,
      },
      bullyingIncidents: {
        total: incidents.length,
        unresolved: incidents.filter((i) => i.resolutionStatus !== BullyingResolutionStatus.RESOLVED).length,
        bySeverity: incidentsBySeverity,
      },
    };
  }

  async getInterventionEffectivenessReport(schoolId: string): Promise<{
    completedInterventions: number;
    averageEffectiveness: string | null;
    byInterventionType: Record<string, { count: number; averageEffectiveness: string }>;
    byStatus: Record<string, number>;
  }> {
    const [allInterventions, completedInterventions] = await Promise.all([
      this.interventionRepository.find({ where: { schoolId } }),
      this.interventionRepository.find({
        where: { schoolId, status: InterventionStatus.COMPLETED, effectivenessRating: Not(IsNull()) },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    allInterventions.forEach((i) => {
      byStatus[i.status] = (byStatus[i.status] || 0) + 1;
    });

    const typeTotals: Record<string, { sum: number; count: number }> = {};
    completedInterventions.forEach((i) => {
      if (!typeTotals[i.interventionType]) {
        typeTotals[i.interventionType] = { sum: 0, count: 0 };
      }
      typeTotals[i.interventionType].sum += i.effectivenessRating;
      typeTotals[i.interventionType].count++;
    });

    const byInterventionType: Record<string, { count: number; averageEffectiveness: string }> = {};
    Object.entries(typeTotals).forEach(([type, { sum, count }]) => {
      byInterventionType[type] = { count, averageEffectiveness: (sum / count).toFixed(1) };
    });

    const overallSum = completedInterventions.reduce((sum, i) => sum + i.effectivenessRating, 0);

    return {
      completedInterventions: completedInterventions.length,
      averageEffectiveness:
        completedInterventions.length > 0 ? (overallSum / completedInterventions.length).toFixed(1) : null,
      byInterventionType,
      byStatus,
    };
  }
}
