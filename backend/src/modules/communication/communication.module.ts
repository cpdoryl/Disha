import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentCommunication } from 'src/database/entities';
import { CommunicationService } from 'src/services/communication.service';
import { CommunicationController } from './communication.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParentCommunication])],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
