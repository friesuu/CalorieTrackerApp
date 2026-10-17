import { MigrationInterface, QueryRunner } from "typeorm";

export class Exercise1792139414604 implements MigrationInterface {
    name = 'Exercise1792139414604'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "exercises" ("id" SERIAL NOT NULL, "daily_log_id" integer NOT NULL, "name" character varying(100) NOT NULL, "minutes" integer, "kcal" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "daily_logs" ADD "exercise_in_budget" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "exercise_in_budget" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "exercises" ADD CONSTRAINT "FK_1121e0e772e17e324ebe867ac56" FOREIGN KEY ("daily_log_id") REFERENCES "daily_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exercises" DROP CONSTRAINT "FK_1121e0e772e17e324ebe867ac56"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "exercise_in_budget"`);
        await queryRunner.query(`ALTER TABLE "daily_logs" DROP COLUMN "exercise_in_budget"`);
        await queryRunner.query(`DROP TABLE "exercises"`);
    }

}
