import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdditionalTables1724056801000 implements MigrationInterface {
  name = 'AdditionalTables1724056801000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create challenges table
    await queryRunner.query(`
      CREATE TABLE "challenges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "domain" character varying(100) NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "riskIndicators" jsonb,
        "interventionStrategies" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);

    // Create gap_predictions table
    await queryRunner.query(`
      CREATE TABLE "gap_predictions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "assessmentId" uuid NOT NULL,
        "challengeId" uuid NOT NULL,
        "currentValue" numeric,
        "targetValue" numeric,
        "predictedGap" numeric,
        "gapPercentage" numeric,
        "trendDirection" character varying(50),
        "confidenceTier" character varying(50),
        "recommendations" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id"),
        FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id"),
        FOREIGN KEY ("challengeId") REFERENCES "challenges"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_gaps_schoolId_challengeId" ON "gap_predictions" ("schoolId", "challengeId")`,
    );

    // Create monitoring_scorecards table
    await queryRunner.query(`
      CREATE TABLE "monitoring_scorecards" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "assessmentId" uuid NOT NULL,
        "overallScore" numeric,
        "studentRetention" numeric,
        "dropout" numeric,
        "teacherRetention" numeric,
        "teacherTraining" numeric,
        "systemDuplication" numeric,
        "academicPerformance" numeric,
        "parentalSatisfaction" numeric,
        "emotionalWellbeing" numeric,
        "wordOfMouth" numeric,
        "brandAwareness" numeric,
        "periodStartDate" DATE,
        "periodEndDate" DATE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id"),
        FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_scorecard_schoolId" ON "monitoring_scorecards" ("schoolId")`,
    );

    // Create parent_communication table
    await queryRunner.query(`
      CREATE TABLE "parent_communication" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "type" character varying(100) NOT NULL,
        "subject" character varying(255),
        "message" text,
        "recipient" character varying(255),
        "channel" character varying(50),
        "status" character varying(50) NOT NULL DEFAULT 'pending',
        "sentAt" TIMESTAMP,
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id"),
        FOREIGN KEY ("studentId") REFERENCES "students"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_communication_schoolId" ON "parent_communication" ("schoolId")`,
    );

    // Create counsellor_referrals table
    await queryRunner.query(`
      CREATE TABLE "counsellor_referrals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "studentId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        "referralReason" text,
        "referredBy" uuid,
        "referralDate" TIMESTAMP,
        "status" character varying(50) NOT NULL DEFAULT 'pending',
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("studentId") REFERENCES "students"("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_referral_studentId" ON "counsellor_referrals" ("studentId")`,
    );

    // Create remediation_interventions table
    await queryRunner.query(`
      CREATE TABLE "remediation_interventions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "studentId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        "type" character varying(100),
        "description" text,
        "startDate" DATE,
        "endDate" DATE,
        "status" character varying(50) NOT NULL DEFAULT 'active',
        "completionPercentage" numeric,
        "isCompleted" boolean NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("studentId") REFERENCES "students"("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_intervention_studentId" ON "remediation_interventions" ("studentId")`,
    );

    // Create bullying_incidents table
    await queryRunner.query(`
      CREATE TABLE "bullying_incidents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reportedByStudentId" uuid NOT NULL,
        "involvedStudentIds" uuid[] NOT NULL,
        "schoolId" uuid NOT NULL,
        "incidentDate" DATE NOT NULL,
        "description" text,
        "severity" character varying(50),
        "location" character varying(255),
        "witnesses" text,
        "status" character varying(50) NOT NULL DEFAULT 'reported',
        "resolutionDate" DATE,
        "resolutionDetails" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("reportedByStudentId") REFERENCES "students"("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_bullying_schoolId" ON "bullying_incidents" ("schoolId")`,
    );

    // Create student_academic_assessments table
    await queryRunner.query(`
      CREATE TABLE "student_academic_assessments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "studentId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        "subject" character varying(100),
        "assessmentType" character varying(100),
        "score" numeric,
        "maxScore" numeric,
        "percentage" numeric,
        "grade" character varying(2),
        "assessmentDate" DATE,
        "remarks" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("studentId") REFERENCES "students"("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_academic_assessment_studentId" ON "student_academic_assessments" ("studentId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_academic_assessment_studentId"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "student_academic_assessments"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bullying_schoolId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bullying_incidents"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_intervention_studentId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "remediation_interventions"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_referral_studentId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "counsellor_referrals"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_communication_schoolId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parent_communication"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_scorecard_schoolId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "monitoring_scorecards"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gaps_schoolId_challengeId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gap_predictions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "challenges"`);
  }
}
