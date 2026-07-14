import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1724056800000 implements MigrationInterface {
  name = 'InitialSchema1724056800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL UNIQUE,
        "phone" character varying(20),
        "passwordHash" character varying(255) NOT NULL,
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100),
        "userType" character varying NOT NULL,
        "schoolId" uuid,
        "roleType" character varying NOT NULL DEFAULT 'user',
        "isActive" boolean NOT NULL DEFAULT true,
        "lastLoginAt" TIMESTAMP,
        "profilePictureUrl" character varying(255),
        "bio" text,
        "preferences" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_schoolId_userType" ON "users" ("schoolId", "userType")`,
    );

    // Create organizations table
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL UNIQUE,
        "registrationNumber" character varying(100) UNIQUE,
        "country" character varying(100),
        "state" character varying(100),
        "city" character varying(100),
        "address" text,
        "contactEmail" character varying(255),
        "contactPhone" character varying(20),
        "website" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);

    // Create districts table
    await queryRunner.query(`
      CREATE TABLE "districts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "organizationId" uuid NOT NULL,
        "state" character varying(100),
        "region" character varying(255),
        "contactEmail" character varying(255),
        "contactPhone" character varying(20),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_districts_organizationId" ON "districts" ("organizationId")`,
    );

    // Create schools table
    await queryRunner.query(`
      CREATE TABLE "schools" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "districtId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "registrationNumber" character varying(100) UNIQUE,
        "type" character varying(100),
        "principalName" character varying(255),
        "principalEmail" character varying(255),
        "principalPhone" character varying(20),
        "address" text,
        "city" character varying(100),
        "state" character varying(100),
        "pincode" character varying(20),
        "latitude" numeric,
        "longitude" numeric,
        "studentStrength" integer,
        "staffStrength" integer,
        "classrooms" integer,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("districtId") REFERENCES "districts"("id"),
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_schools_districtId" ON "schools" ("districtId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_schools_organizationId" ON "schools" ("organizationId")`,
    );

    // Create students table
    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "enrollmentNumber" character varying(100) UNIQUE NOT NULL,
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100) NOT NULL,
        "dateOfBirth" DATE,
        "gender" character varying(50),
        "email" character varying(255) UNIQUE,
        "phone" character varying(20),
        "address" text,
        "parentName" character varying(255),
        "parentEmail" character varying(255),
        "parentPhone" character varying(20),
        "currentClass" character varying(50),
        "section" character varying(10),
        "admissionDate" DATE,
        "status" character varying(50) NOT NULL DEFAULT 'active',
        "riskProfile" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_students_schoolId" ON "students" ("schoolId")`,
    );

    // Create student_attendance table
    await queryRunner.query(`
      CREATE TABLE "student_attendance" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "studentId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        "attendanceDate" DATE NOT NULL,
        "status" character varying(50) NOT NULL,
        "remarks" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("studentId") REFERENCES "students"("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_studentId_date" ON "student_attendance" ("studentId", "attendanceDate")`,
    );

    // Create assessments table
    await queryRunner.query(`
      CREATE TABLE "assessments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "challengeDomain" character varying(100) NOT NULL,
        "assessmentType" character varying(100),
        "status" character varying(50) NOT NULL DEFAULT 'draft',
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        "createdBy" uuid,
        "totalQuestions" integer DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_assessments_schoolId" ON "assessments" ("schoolId")`,
    );

    // Create assessment_responses table
    await queryRunner.query(`
      CREATE TABLE "assessment_responses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "assessmentId" uuid NOT NULL,
        "respondentId" uuid NOT NULL,
        "respondentType" character varying(100),
        "responseNumeric" numeric,
        "responseText" text,
        "responseJson" jsonb,
        "submittedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_responses_assessmentId" ON "assessment_responses" ("assessmentId")`,
    );

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "userId" uuid,
        "action" character varying(100) NOT NULL,
        "entityType" character varying(100),
        "entityId" uuid,
        "changes" jsonb,
        "ipAddress" character varying(45),
        "userAgent" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_schoolId_createdAt" ON "audit_logs" ("schoolId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_userId" ON "audit_logs" ("userId")`,
    );

    // Create operational_data table
    await queryRunner.query(`
      CREATE TABLE "operational_data" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "category" character varying(100) NOT NULL,
        "metric" character varying(255) NOT NULL,
        "value" numeric NOT NULL,
        "unit" character varying(50),
        "recordedDate" DATE NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_operational_schoolId_date" ON "operational_data" ("schoolId", "recordedDate")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operational_schoolId_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "operational_data"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_schoolId_createdAt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_responses_assessmentId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assessment_responses"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessments_schoolId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assessments"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_studentId_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_attendance"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_schoolId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schools_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schools_districtId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schools"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_districts_organizationId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "districts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_schoolId_userType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
