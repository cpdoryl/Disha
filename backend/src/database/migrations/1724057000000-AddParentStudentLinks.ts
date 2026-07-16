import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentStudentLinks1724057000000 implements MigrationInterface {
    name = 'AddParentStudentLinks1724057000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."parent_student_links_relationship_enum" AS ENUM('father', 'mother', 'guardian', 'other')`);
        await queryRunner.query(`CREATE TABLE "parent_student_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "parentUserId" uuid NOT NULL, "studentId" uuid NOT NULL, "relationship" "public"."parent_student_links_relationship_enum", "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_09f183319d522d110c93b756868" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d822a0766d7ccb9e6b1b3e1195" ON "parent_student_links" ("studentId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3f1f5e1746fb0face376e4d946" ON "parent_student_links" ("parentUserId", "studentId") `);
        await queryRunner.query(`ALTER TABLE "students" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "UQ_e0208b4f964e609959aff431bf9" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_e0208b4f964e609959aff431bf9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parent_student_links" ADD CONSTRAINT "FK_14e9a1df50af837f5b17cb99634" FOREIGN KEY ("parentUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parent_student_links" ADD CONSTRAINT "FK_d822a0766d7ccb9e6b1b3e11958" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "parent_student_links" DROP CONSTRAINT "FK_d822a0766d7ccb9e6b1b3e11958"`);
        await queryRunner.query(`ALTER TABLE "parent_student_links" DROP CONSTRAINT "FK_14e9a1df50af837f5b17cb99634"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_e0208b4f964e609959aff431bf9"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "UQ_e0208b4f964e609959aff431bf9"`);
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f1f5e1746fb0face376e4d946"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d822a0766d7ccb9e6b1b3e1195"`);
        await queryRunner.query(`DROP TABLE "parent_student_links"`);
        await queryRunner.query(`DROP TYPE "public"."parent_student_links_relationship_enum"`);
    }

}
