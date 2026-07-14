import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { School } from './School.entity';

export enum DataType {
  FEE_DEFAULT = 'fee_default',
  ADMISSION_INQUIRY = 'admission_inquiry',
  STUDENT_WITHDRAWAL = 'student_withdrawal',
  INFRASTRUCTURE_STATUS = 'infrastructure_status',
  COMPLIANCE_STATUS = 'compliance_status',
  COMMUNICATION_LOG = 'communication_log',
  OTHER = 'other',
}

@Entity('operational_data')
@Index(['schoolId', 'dataDate'])
@Index(['dataType'])
export class OperationalData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'enum', enum: DataType })
  dataType: DataType;

  @Column({ type: 'date' })
  dataDate: Date;

  @Column({ type: 'date', nullable: true })
  monthYear: Date; // Derived for indexing

  @Column({ type: 'jsonb' })
  dataValue: Record<string, any>; // Flexible storage for different data types

  @Column({ type: 'int', nullable: true })
  quantity: number; // For countable data

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // How the data was collected

  @CreateDateColumn()
  createdAt: Date;
}
