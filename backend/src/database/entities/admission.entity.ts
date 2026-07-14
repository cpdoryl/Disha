import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { School } from './School.entity';

export enum AdmissionStatus {
  INQUIRY = 'inquiry',
  APPLICATION = 'application',
  APPLIED = 'applied',
  INTERVIEWED = 'interviewed',
  OFFERED = 'offered',
  ADMITTED = 'admitted',
  REJECTED = 'rejected',
  WAITLISTED = 'waitlisted',
  DECLINED = 'declined',
}

export enum AdmissionSource {
  WALK_IN = 'walk_in',
  REFERRAL = 'referral',
  ONLINE = 'online',
  SOCIAL_MEDIA = 'social_media',
  ADVERTISEMENT = 'advertisement',
  SCHOOL_VISIT = 'school_visit',
  ALUMNI = 'alumni',
  OTHER = 'other',
}

@Entity('admissions')
@Index(['schoolId', 'admissionDate'])
@Index(['status', 'admissionDate'])
@Index(['studentName'])
export class Admission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 255 })
  studentName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  guardianName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  guardianPhone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  guardianEmail: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'int' })
  gradeApplied: number; // 1-12

  @Column({ type: 'date' })
  admissionDate: Date;

  @Column({ type: 'enum', enum: AdmissionStatus })
  status: AdmissionStatus;

  @Column({ type: 'enum', enum: AdmissionSource })
  sourceOfInquiry: AdmissionSource;

  @Column({ type: 'date', nullable: true })
  interviewDate: Date;

  @Column({ type: 'int', nullable: true })
  interviewScore: number; // 0-100

  @Column({ type: 'date', nullable: true })
  admissionOfferDate: Date;

  @Column({ type: 'date', nullable: true })
  admissionAcceptanceDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  scholarshipStatus: string; // none, applied, awarded

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  scholarshipAmount: number; // In currency units

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}
