import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities';
import { UserService } from 'src/services/user.service';
import { UserController } from './user.controller';
import { SchoolModule } from '../school/school.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SchoolModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
