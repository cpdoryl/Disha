import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, Index, JoinTable } from 'typeorm';
import { Question } from './question.entity';

export enum ChallengeCategory {
  GROWTH_ENROLLMENT = 'growth_enrollment',
  PEOPLE = 'people',
  ACADEMIC_WELLBEING = 'academic_wellbeing',
  REPUTATION_MARKETING = 'reputation_marketing',
  OPERATIONS_FINANCE = 'operations_finance',
}

@Entity('challenges')
@Index(['code'], { unique: true })
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  displayName: string;

  @Column({ type: 'enum', enum: ChallengeCategory })
  category: ChallengeCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  iconName: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToMany(() => Question, (question) => question.challenges)
  @JoinTable({
    name: 'challenge_question_mapping',
    joinColumn: { name: 'challenge_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'question_id', referencedColumnName: 'id' },
  })
  questions: Question[];
}

// Predefined challenges for menu
export const PREDEFINED_CHALLENGES = [
  // Growth & Enrollment
  {
    code: 'enrollment_decline',
    displayName: 'Enrollment Decline / Admission Shortfall',
    category: ChallengeCategory.GROWTH_ENROLLMENT,
    description: 'Where in the admissions funnel are prospects being lost?',
    iconName: 'user-slash',
  },
  {
    code: 'student_attrition',
    displayName: 'Student Attrition / Mid-Year Dropout',
    category: ChallengeCategory.GROWTH_ENROLLMENT,
    description: 'Which grades and sections lose students, and why?',
    iconName: 'exit',
  },

  // People
  {
    code: 'teacher_attrition',
    displayName: 'Teacher Attrition / Staff Turnover',
    category: ChallengeCategory.PEOPLE,
    description: 'Are teachers leaving? Why?',
    iconName: 'briefcase-off',
  },
  {
    code: 'staff_quality',
    displayName: 'Staff Quality, Training and Capability Gaps',
    category: ChallengeCategory.PEOPLE,
    description: 'Are teachers qualified and well-trained?',
    iconName: 'certificate',
  },

  // Academic & Student Wellbeing
  {
    code: 'academic_decline',
    displayName: 'Academic Performance Decline or Stagnation',
    category: ChallengeCategory.ACADEMIC_WELLBEING,
    description: 'Are results flat, falling, or rising at cost of student stress?',
    iconName: 'trending-down',
  },
  {
    code: 'student_wellbeing',
    displayName: 'Student Emotional Wellbeing and Behavioral Concerns',
    category: ChallengeCategory.ACADEMIC_WELLBEING,
    description: 'Are students stressed, anxious, or showing behavioral issues?',
    iconName: 'heart-crack',
  },
  {
    code: 'digital_wellness',
    displayName: 'Digital Wellness / Screen-Time Concerns',
    category: ChallengeCategory.ACADEMIC_WELLBEING,
    description: 'Are students spending too much time on screens?',
    iconName: 'smartphone',
  },
  {
    code: 'holistic_development',
    displayName: 'Extracurricular and Holistic Development Gap',
    category: ChallengeCategory.ACADEMIC_WELLBEING,
    description: 'Are students getting enough non-academic opportunities?',
    iconName: 'star',
  },

  // Reputation, Marketing & Competition
  {
    code: 'competitive_pressure',
    displayName: 'Competitive Pressure from Nearby Schools',
    category: ChallengeCategory.REPUTATION_MARKETING,
    description: 'How do you compare with competitors?',
    iconName: 'crosshair',
  },
  {
    code: 'parent_dissatisfaction',
    displayName: 'Parent Dissatisfaction / Rising Complaints',
    category: ChallengeCategory.REPUTATION_MARKETING,
    description: 'Are parents complaining or unhappy?',
    iconName: 'message-alert',
  },
  {
    code: 'brand_reputation',
    displayName: 'Brand and Digital Reputation Weakness',
    category: ChallengeCategory.REPUTATION_MARKETING,
    description: 'How does the school look online?',
    iconName: 'search',
  },

  // Operations, Finance, Infrastructure & Compliance
  {
    code: 'fee_collection',
    displayName: 'Fee Collection and Financial Stress',
    category: ChallengeCategory.OPERATIONS_FINANCE,
    description: 'Are students/families having trouble paying fees?',
    iconName: 'wallet-off',
  },
  {
    code: 'infrastructure_gaps',
    displayName: 'Infrastructure and Facility Gaps',
    category: ChallengeCategory.OPERATIONS_FINANCE,
    description: 'Are facilities adequate and well-maintained?',
    iconName: 'building',
  },
  {
    code: 'regulatory_compliance',
    displayName: 'Regulatory, NEP 2020 and Board Compliance Risk',
    category: ChallengeCategory.OPERATIONS_FINANCE,
    description: 'Are you compliant with board and regulatory requirements?',
    iconName: 'file-check',
  },
  {
    code: 'technology_adoption',
    displayName: 'Technology Adoption / Operational Inefficiency',
    category: ChallengeCategory.OPERATIONS_FINANCE,
    description: 'Are operations still paper-based and manual?',
    iconName: 'computer-off',
  },
];
