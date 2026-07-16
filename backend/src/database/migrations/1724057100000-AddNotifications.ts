import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1724057100000 implements MigrationInterface {
    name = 'AddNotifications1724057100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('attendance_alert', 'academic_performance', 'fee_reminder', 'incident_notification', 'assessment_invitation', 'general_update')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_channel_enum" AS ENUM('sms', 'email', 'whatsapp', 'in_app')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recipientUserId" uuid NOT NULL, "schoolId" uuid, "type" "public"."notifications_type_enum" NOT NULL, "channel" "public"."notifications_channel_enum" NOT NULL DEFAULT 'in_app', "title" character varying(255) NOT NULL, "message" text NOT NULL, "relatedStudentId" uuid, "isRead" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a3f910231f62987cb87b0ba5dd" ON "notifications" ("recipientUserId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_0be815cabd15a62a5546a4b1357" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_0be815cabd15a62a5546a4b1357"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a3f910231f62987cb87b0ba5dd"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }

}
