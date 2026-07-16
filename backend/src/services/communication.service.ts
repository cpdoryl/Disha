import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentCommunication, CommunicationChannel, CommunicationStatus } from 'src/database/entities';

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(ParentCommunication)
    private communicationRepository: Repository<ParentCommunication>,
  ) {}

  async logCommunication(logDto: {
    schoolId: string;
    parentId?: string;
    studentId?: string;
    queryDate: string;
    queryChannel: CommunicationChannel;
    queryTopic: string;
    queryDescription: string;
    handledByStaff?: string;
  }): Promise<ParentCommunication> {
    const communication = this.communicationRepository.create({
      ...logDto,
      queryDate: new Date(logDto.queryDate),
      status: CommunicationStatus.PENDING,
    } as Partial<ParentCommunication>);
    return this.communicationRepository.save(communication);
  }

  async respond(
    communicationId: string,
    responseContent: string,
  ): Promise<ParentCommunication | null> {
    const communication = await this.communicationRepository.findOne({ where: { id: communicationId } });
    if (!communication) return null;

    const responseProvidedDate = new Date();
    const responseTimeHours = Math.round(
      (responseProvidedDate.getTime() - new Date(communication.queryDate).getTime()) / (1000 * 60 * 60),
    );

    await this.communicationRepository.update(communicationId, {
      responseContent,
      responseProvidedDate,
      responseTimeHours,
      status: CommunicationStatus.RESOLVED,
    });
    return this.communicationRepository.findOne({ where: { id: communicationId } });
  }

  async getBySchool(schoolId: string, status?: CommunicationStatus): Promise<ParentCommunication[]> {
    return this.communicationRepository.find({
      where: status ? { schoolId, status } : { schoolId },
      order: { queryDate: 'DESC' },
    });
  }

  async getByStudent(studentId: string): Promise<ParentCommunication[]> {
    return this.communicationRepository.find({
      where: { studentId },
      order: { queryDate: 'DESC' },
    });
  }

  async getResponseMetrics(schoolId: string): Promise<{
    totalQueries: number;
    resolvedQueries: number;
    pendingQueries: number;
    escalatedQueries: number;
    averageResponseTimeHours: number | null;
  }> {
    const communications = await this.communicationRepository.find({ where: { schoolId } });
    const resolved = communications.filter((c) => c.status === CommunicationStatus.RESOLVED);
    const responseTimes = resolved
      .map((c) => c.responseTimeHours)
      .filter((hours): hours is number => hours != null);

    return {
      totalQueries: communications.length,
      resolvedQueries: resolved.length,
      pendingQueries: communications.filter((c) => c.status === CommunicationStatus.PENDING).length,
      escalatedQueries: communications.filter((c) => c.status === CommunicationStatus.ESCALATED).length,
      averageResponseTimeHours:
        responseTimes.length > 0
          ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 100) / 100
          : null,
    };
  }
}
