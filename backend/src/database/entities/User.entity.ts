import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UserType {
  PARENT = 'parent',
  TEACHER = 'teacher',
  STAFF = 'staff',
  SCHOOL_LEADER = 'school_leader',
  ADMIN = 'admin',
}

export enum RoleType {
  OWNER = 'owner',
  ADMIN = 'admin',
  COUNSELLOR = 'counsellor',
  TEACHER = 'teacher',
  PARENT = 'parent',
  VIEWER = 'viewer',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserType })
  userType: UserType;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.VIEWER })
  role: RoleType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
