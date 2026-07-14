import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserType {
  SCHOOL_ADMIN = 'school_admin',
  TEACHER = 'teacher',
  PARENT = 'parent',
  STUDENT = 'student',
  RYL_ADMIN = 'ryl_admin',
  RYL_SUPPORT = 'ryl_support',
}

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['schoolId', 'userType'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'enum', enum: UserType })
  userType: UserType;

  @Column({ type: 'uuid', nullable: true })
  schoolId: string;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.USER })
  roleType: RoleType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>; // User preferences (theme, language, etc.)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
