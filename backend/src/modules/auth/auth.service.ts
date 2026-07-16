import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/entities';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  schoolId: string;
  role: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async generateTokens(userId: string, schoolId: string, role: string, email: string) {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      schoolId,
      role,
      email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseInt(this.configService.get('jwt.expiresIn') || '900'),
    };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await this.comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const tokens = await this.generateTokens(user.id, user.schoolId || '', user.userType, user.email);

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName || '',
        role: user.userType,
      },
    };
  }

  async refreshTokens(refreshToken: string, userId: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      if (payload.sub !== userId) {
        throw new UnauthorizedException('Token user mismatch');
      }

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user.id, user.schoolId || '', user.userType, user.email);
    } catch (error: any) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
