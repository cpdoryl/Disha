import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeLedger, FeeType, FeeStatus, PaymentMethod } from 'src/database/entities';

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(FeeLedger)
    private feeRepository: Repository<FeeLedger>,
  ) {}

  async createFeeEntry(createFeeDto: {
    schoolId: string;
    studentId: string;
    academicYear: string;
    feeType: FeeType;
    amount: number;
    dueDate: string;
    remarks?: string;
  }): Promise<FeeLedger> {
    const fee = this.feeRepository.create({
      ...createFeeDto,
      dueDate: new Date(createFeeDto.dueDate),
      status: FeeStatus.PENDING,
    } as Partial<FeeLedger>);
    return this.feeRepository.save(fee);
  }

  async recordPayment(
    feeId: string,
    paidAmount: number,
    paymentMethod: PaymentMethod,
    paymentReference?: string,
  ): Promise<FeeLedger | null> {
    const fee = await this.feeRepository.findOne({ where: { id: feeId } });
    if (!fee) return null;

    const totalPaid = Number(fee.paidAmount) + paidAmount;
    const status = totalPaid >= Number(fee.amount) ? FeeStatus.PAID : FeeStatus.PARTIAL;

    await this.feeRepository.update(feeId, {
      paidAmount: totalPaid,
      paidDate: new Date(),
      paymentMethod,
      paymentReference,
      status,
    });
    return this.feeRepository.findOne({ where: { id: feeId } });
  }

  async getFeeLedgerBySchool(schoolId: string, status?: FeeStatus): Promise<FeeLedger[]> {
    return this.feeRepository.find({
      where: status ? { schoolId, status } : { schoolId },
      order: { dueDate: 'DESC' },
    });
  }

  async getFeeLedgerByStudent(studentId: string): Promise<FeeLedger[]> {
    return this.feeRepository.find({
      where: { studentId },
      order: { dueDate: 'DESC' },
    });
  }

  async getCollectionSummary(schoolId: string): Promise<{
    totalDue: number;
    totalCollected: number;
    outstandingAmount: number;
    collectionRate: number;
    overdueCount: number;
  }> {
    const entries = await this.feeRepository.find({ where: { schoolId } });
    const totalDue = entries.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCollected = entries.reduce((sum, e) => sum + Number(e.paidAmount), 0);
    const today = new Date();
    const overdueCount = entries.filter(
      (e) => e.status !== FeeStatus.PAID && e.status !== FeeStatus.WAIVED && new Date(e.dueDate) < today,
    ).length;

    return {
      totalDue,
      totalCollected,
      outstandingAmount: totalDue - totalCollected,
      collectionRate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 10000) / 100 : 0,
      overdueCount,
    };
  }
}
