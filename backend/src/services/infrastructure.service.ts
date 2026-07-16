import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationalData, DataType } from 'src/database/entities';

export interface InfrastructureStatus {
  classroomCount?: number;
  labCount?: number;
  hasLibrary?: boolean;
  hasPlayground?: boolean;
  internetConnectivity?: 'none' | 'partial' | 'full';
  sanitationRating?: number; // 1-5
  safetyComplianceRating?: number; // 1-5
  [key: string]: unknown;
}

@Injectable()
export class InfrastructureService {
  constructor(
    @InjectRepository(OperationalData)
    private operationalDataRepository: Repository<OperationalData>,
  ) {}

  async recordStatus(recordDto: {
    schoolId: string;
    dataDate: string;
    status: InfrastructureStatus;
    notes?: string;
    source?: string;
  }): Promise<OperationalData> {
    const dataDate = new Date(recordDto.dataDate);
    const record = this.operationalDataRepository.create({
      schoolId: recordDto.schoolId,
      dataType: DataType.INFRASTRUCTURE_STATUS,
      dataDate,
      monthYear: new Date(dataDate.getFullYear(), dataDate.getMonth(), 1),
      dataValue: recordDto.status,
      notes: recordDto.notes,
      source: recordDto.source || 'manual_entry',
    });
    return this.operationalDataRepository.save(record);
  }

  async getBySchool(schoolId: string): Promise<OperationalData[]> {
    return this.operationalDataRepository.find({
      where: { schoolId, dataType: DataType.INFRASTRUCTURE_STATUS },
      order: { dataDate: 'DESC' },
    });
  }

  async getLatestForSchool(schoolId: string): Promise<OperationalData | null> {
    const [latest] = await this.operationalDataRepository.find({
      where: { schoolId, dataType: DataType.INFRASTRUCTURE_STATUS },
      order: { dataDate: 'DESC' },
      take: 1,
    });
    return latest ?? null;
  }
}
