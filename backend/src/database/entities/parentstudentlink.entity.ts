import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { User } from './User.entity';
import { Student } from './student.entity';

export enum GuardianRelationship {
  FATHER = 'father',
  MOTHER = 'mother',
  GUARDIAN = 'guardian',
  OTHER = 'other',
}

// Many-to-many: a student can have more than one parent/guardian with a
// login, and a parent can have more than one child (including across schools).
@Entity('parent_student_links')
@Index(['parentUserId', 'studentId'], { unique: true })
@Index(['studentId'])
export class ParentStudentLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'parentUserId' })
  parent: User;

  @Column({ type: 'uuid' })
  parentUserId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'enum', enum: GuardianRelationship, nullable: true })
  relationship: GuardianRelationship;

  @CreateDateColumn()
  createdAt: Date;
}
