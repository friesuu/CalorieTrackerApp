import { MigrationInterface, QueryRunner } from "typeorm";

export class MealSections1792136495826 implements MigrationInterface {
    name = 'MealSections1792136495826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."log_entries_meal_enum" AS ENUM('breakfast', 'lunch', 'dinner', 'snack')`);
        await queryRunner.query(`ALTER TABLE "log_entries" ADD "meal" "public"."log_entries_meal_enum"`);
        await queryRunner.query(`ALTER TABLE "daily_logs" ADD "breakfast_pct" integer NOT NULL DEFAULT '25'`);
        await queryRunner.query(`ALTER TABLE "daily_logs" ADD "lunch_pct" integer NOT NULL DEFAULT '35'`);
        await queryRunner.query(`ALTER TABLE "daily_logs" ADD "dinner_pct" integer NOT NULL DEFAULT '30'`);
        await queryRunner.query(`ALTER TABLE "daily_logs" ADD "snack_pct" integer NOT NULL DEFAULT '10'`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "breakfast_pct" integer NOT NULL DEFAULT '25'`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "lunch_pct" integer NOT NULL DEFAULT '35'`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "dinner_pct" integer NOT NULL DEFAULT '30'`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "snack_pct" integer NOT NULL DEFAULT '10'`);
        await queryRunner.query(`ALTER TABLE "daily_logs" ADD CONSTRAINT "CHK_daily_logs_split_adds_up" CHECK ("breakfast_pct" + "lunch_pct" + "dinner_pct" + "snack_pct" = 100)`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "CHK_profiles_split_adds_up" CHECK ("breakfast_pct" + "lunch_pct" + "dinner_pct" + "snack_pct" = 100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "CHK_profiles_split_adds_up"`);
        await queryRunner.query(`ALTER TABLE "daily_logs" DROP CONSTRAINT "CHK_daily_logs_split_adds_up"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "snack_pct"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "dinner_pct"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "lunch_pct"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "breakfast_pct"`);
        await queryRunner.query(`ALTER TABLE "daily_logs" DROP COLUMN "snack_pct"`);
        await queryRunner.query(`ALTER TABLE "daily_logs" DROP COLUMN "dinner_pct"`);
        await queryRunner.query(`ALTER TABLE "daily_logs" DROP COLUMN "lunch_pct"`);
        await queryRunner.query(`ALTER TABLE "daily_logs" DROP COLUMN "breakfast_pct"`);
        await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "meal"`);
        await queryRunner.query(`DROP TYPE "public"."log_entries_meal_enum"`);
    }

}
