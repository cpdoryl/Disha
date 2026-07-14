import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentCommunication } from 'src/database/entities';
import { NotificationService } from 'src/services/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([ParentCommunication])],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
