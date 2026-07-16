import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { School } from './School.entity';
import { Student } from './student.entity';

export enum FeeType {
  TUITION = 'tuition',
  TRANSPORT = 'transport',
  ADMISSION = 'admission',
  EXAM = 'exam',
  MISCELLANEOUS = 'miscellaneous',
}

export enum FeeStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
}

export enum PaymentMethod {
  CASH = 'cash',
  ONLINE = 'online',
  CHEQUE = 'cheque',
  UPI = 'upi',
  OTHER = 'other',
}

@Entity('fee_ledger')
@Index(['schoolId', 'status'])
@Index(['studentId', 'academicYear'])
@Index(['dueDate'])
export class FeeLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => Student)
  student: Student;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar', length: 20 })
  academicYear: string;

  @Column({ type: 'enum', enum: FeeType })
  feeType: FeeType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  // Razorpay (or other gateway) transaction reference only - raw payment
  // details are tokenized externally and never stored here.
  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentReference: string;

  @Column({ type: 'enum', enum: FeeStatus, default: FeeStatus.PENDING })
  status: FeeStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
