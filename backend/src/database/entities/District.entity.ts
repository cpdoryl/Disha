import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('districts')
@Index(['state'])
export class District {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'int', default: 0 })
  schoolsCount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  districtCode: string;

  @CreateDateColumn()
  createdAt: Date;
}
