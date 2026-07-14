import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1724056802000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1724056802000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // School indexes for filtering and searching
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_schools_isActive" ON "schools" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_schools_organizationId_isActive" ON "schools" ("organizationId", "isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_schools_district" ON "schools" ("district")`,
    );

    // Student indexes for filtering and searching
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_students_status" ON "students" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_students_gradeLevel" ON "students" ("gradeLevel")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_students_firstName_lastName" ON "students" ("firstName", "lastName")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_students_schoolId_status" ON "students" ("schoolId", "status")`,
    );

    // Assessment indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assessments_status" ON "assessments" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assessments_schoolId_status" ON "assessments" ("schoolId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assessments_startDate_endDate" ON "assessments" ("startDate", "endDate")`,
    );

    // Assessment responses indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_responses_respondentId" ON "assessment_responses" ("respondentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_responses_submittedAt" ON "assessment_responses" ("submittedAt")`,
    );

    // User indexes for login and access control
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_isActive" ON "users" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_schoolId_isActive" ON "users" ("schoolId", "isActive")`,
    );

    // Audit log indexes for efficient querying
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_action" ON "audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_userId_createdAt" ON "audit_logs" ("userId", "createdAt")`,
    );

    // Attendance indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_attendance_status" ON "student_attendance" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_attendance_attendanceDate" ON "student_attendance" ("attendanceDate")`,
    );

    // Gap prediction indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_gaps_challengeId" ON "gap_predictions" ("challengeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_gaps_assessmentId" ON "gap_predictions" ("assessmentId")`,
    );

    // Parent communication indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_communication_status" ON "parent_communication" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_communication_studentId_status" ON "parent_communication" ("studentId", "status")`,
    );

    // Wellbeing-related indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_referral_status" ON "counsellor_referrals" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_intervention_status" ON "remediation_interventions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bullying_status" ON "bullying_incidents" ("status")`,
    );

    // Academic assessment indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academic_subject" ON "student_academic_assessments" ("subject")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academic_assessmentType" ON "student_academic_assessments" ("assessmentType")`,
    );

    // Operational data indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operational_category" ON "operational_data" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operational_recordedDate" ON "operational_data" ("recordedDate")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all created indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schools_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schools_organizationId_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schools_district"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_gradeLevel"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_firstName_lastName"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_schoolId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessments_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessments_schoolId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessments_startDate_endDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_responses_respondentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_responses_submittedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_schoolId_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_userId_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_attendanceDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gaps_challengeId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gaps_assessmentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_communication_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_communication_studentId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_referral_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_intervention_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bullying_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_academic_subject"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_academic_assessmentType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operational_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operational_recordedDate"`);
  }
}
