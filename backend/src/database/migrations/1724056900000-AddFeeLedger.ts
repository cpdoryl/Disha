import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeeLedger1724056900000 implements MigrationInterface {
    name = 'AddFeeLedger1724056900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."fee_ledger_feetype_enum" AS ENUM('tuition', 'transport', 'admission', 'exam', 'miscellaneous')`);
        await queryRunner.query(`CREATE TYPE "public"."fee_ledger_paymentmethod_enum" AS ENUM('cash', 'online', 'cheque', 'upi', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."fee_ledger_status_enum" AS ENUM('pending', 'partial', 'paid', 'overdue', 'waived')`);
        await queryRunner.query(`CREATE TABLE "fee_ledger" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "schoolId" uuid NOT NULL, "studentId" uuid NOT NULL, "academicYear" character varying(20) NOT NULL, "feeType" "public"."fee_ledger_feetype_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "dueDate" date NOT NULL, "paidAmount" numeric(10,2) NOT NULL DEFAULT '0', "paidDate" date, "paymentMethod" "public"."fee_ledger_paymentmethod_enum", "paymentReference" character varying(100), "status" "public"."fee_ledger_status_enum" NOT NULL DEFAULT 'pending', "remarks" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a502318982f7ca9bba064d37fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_da68c6809414c3dcefadbff28c" ON "fee_ledger" ("dueDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9666710838250f4e7ae9aedb0" ON "fee_ledger" ("studentId", "academicYear") `);
        await queryRunner.query(`CREATE INDEX "IDX_5891fcddaa16937c592eb04793" ON "fee_ledger" ("schoolId", "status") `);
        await queryRunner.query(`ALTER TABLE "fee_ledger" ADD CONSTRAINT "FK_aa289dd77b227bb784bb974d3a6" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fee_ledger" ADD CONSTRAINT "FK_477d01775aee33601c55a348ed7" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fee_ledger" DROP CONSTRAINT "FK_477d01775aee33601c55a348ed7"`);
        await queryRunner.query(`ALTER TABLE "fee_ledger" DROP CONSTRAINT "FK_aa289dd77b227bb784bb974d3a6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5891fcddaa16937c592eb04793"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9666710838250f4e7ae9aedb0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da68c6809414c3dcefadbff28c"`);
        await queryRunner.query(`DROP TABLE "fee_ledger"`);
        await queryRunner.query(`DROP TYPE "public"."fee_ledger_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."fee_ledger_paymentmethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."fee_ledger_feetype_enum"`);
    }

}
