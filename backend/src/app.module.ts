import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Import all feature modules
import { AuthModule } from './modules/auth/auth.module';
import { SchoolModule } from './modules/school/school.module';
import { StudentModule } from './modules/student/student.module';
import { ChallengeModule } from './modules/challenge/challenge.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { GapPredictionModule } from './modules/gap-prediction/gap-prediction.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { DataModule } from './modules/data/data.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';
import { WellbeingModule } from './modules/wellbeing/wellbeing.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { FeeModule } from './modules/fee/fee.module';
import { StaffModule } from './modules/staff/staff.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { InfrastructureModule } from './modules/infrastructure/infrastructure.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
        synchronize: configService.get('database.synchronize') || false,
        logging: configService.get('database.logging') || false,
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Feature modules
    AuthModule,
    SchoolModule,
    StudentModule,
    ChallengeModule,
    AssessmentModule,
    GapPredictionModule,
    ReportingModule,
    DataModule,
    NotificationModule,
    AuditModule,
    WellbeingModule,
    AdmissionsModule,
    FeeModule,
    StaffModule,
    AttendanceModule,
    ComplianceModule,
    CommunicationModule,
    InfrastructureModule,
  ],
})
export class AppModule {}
