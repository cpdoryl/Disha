import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserType } from 'src/database/entities';
import { SchoolService } from './school.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private schoolService: SchoolService,
  ) {}

  async createUser(createUserDto: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    userType: UserType;
    schoolId?: string;
    phone?: string;
  }): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      userType: createUserDto.userType,
      schoolId: createUserDto.schoolId,
      phone: createUserDto.phone,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);
    const { passwordHash: _omit, ...safeUser } = saved;
    return safeUser;
  }

  async getUser(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;
    const { passwordHash: _omit, ...safeUser } = user;
    return safeUser;
  }

  async getUsersBySchool(schoolId: string): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository.find({
      where: { schoolId },
      order: { firstName: 'ASC' },
    });
    return users.map(({ passwordHash: _omit, ...safeUser }) => safeUser);
  }

  async getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository.find({ order: { createdAt: 'DESC' } });
    return users.map(({ passwordHash: _omit, ...safeUser }) => safeUser);
  }

  async assignRole(userId: string, userType: UserType): Promise<Omit<User, 'passwordHash'> | null> {
    await this.userRepository.update(userId, { userType });
    return this.getUser(userId);
  }

  async setActiveStatus(userId: string, isActive: boolean): Promise<Omit<User, 'passwordHash'> | null> {
    await this.userRepository.update(userId, { isActive });
    return this.getUser(userId);
  }

  async getOrgOverview(): Promise<{
    totalSchools: number;
    totalUsers: number;
    activeUsers: number;
    usersByType: Record<UserType, number>;
  }> {
    const [schools, users] = await Promise.all([
      this.schoolService.getAllSchools(),
      this.userRepository.find(),
    ]);

    const usersByType = Object.values(UserType).reduce(
      (acc, type) => ({ ...acc, [type]: 0 }),
      {} as Record<UserType, number>,
    );
    for (const user of users) {
      usersByType[user.userType] += 1;
    }

    return {
      totalSchools: schools.length,
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      usersByType,
    };
  }
}
