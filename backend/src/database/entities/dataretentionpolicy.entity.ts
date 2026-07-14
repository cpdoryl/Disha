import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DataClassification {
  PERSONALLY_IDENTIFIABLE = 'personally_identifiable',
  EDUCATIONAL_RECORDS = 'educational_records',
  ASSESSMENT_DATA = 'assessment_data',
  OPERATIONAL = 'operational',
  LOGS = 'logs',
}

export enum RetentionAction {
  RETAIN = 'retain',
  ARCHIVE = 'archive',
  ANONYMIZE = 'anonymize',
  DELETE = 'delete',
}

@Entity('data_retention_policies')
@Index(['dataClassification'])
export class DataRetentionPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: DataClassification })
  dataClassification: DataClassification;

  @Column({ type: 'varchar', length: 255 })
  policyName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  retentionMonths: number; // How long to keep active data

  @Column({ type: 'int', nullable: true })
  archiveMonths: number; // How long to keep archived data

  @Column({ type: 'enum', enum: RetentionAction })
  actionAfterRetention: RetentionAction; // What to do when retention period expires

  @Column({ type: 'text', nullable: true })
  policyReasoning: string; // Compliance, business, legal rationale

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  complianceReference: string; // e.g., "GDPR Article 17", "FERPA"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
