import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1792034388028 implements MigrationInterface {
    name = 'CreateTables1792034388028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "timezone" character varying(50) NOT NULL DEFAULT 'Asia/Kuala_Lumpur', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "foods" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "serving_size" numeric(7,2) NOT NULL, "serving_unit" character varying(30) NOT NULL, "kcal_per_serving" integer NOT NULL, "protein_g" numeric(6,1), "carbs_g" numeric(6,1), "fat_g" numeric(6,1), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "owner_id" integer NOT NULL, CONSTRAINT "UQ_1983e7d28be864adc8566f6e46d" UNIQUE ("owner_id", "name"), CONSTRAINT "PK_0cc83421325632f61fa27a52b59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "log_entries" ("id" SERIAL NOT NULL, "daily_log_id" integer NOT NULL, "food_id" integer, "name" character varying(100) NOT NULL, "serving_size" numeric(7,2) NOT NULL, "serving_unit" character varying(30) NOT NULL, "kcal_per_serving" integer NOT NULL, "protein_g" numeric(6,1), "carbs_g" numeric(6,1), "fat_g" numeric(6,1), "quantity" numeric(6,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b226cc4051321f12106771581e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "daily_logs" ("id" SERIAL NOT NULL, "log_date" date NOT NULL, "target_kcal" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "owner_id" integer NOT NULL, CONSTRAINT "UQ_d5a1053376a0bc50981b7fc7d84" UNIQUE ("owner_id", "log_date"), CONSTRAINT "PK_ea32d6160ba0b85cb14426c50b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."profiles_sex_enum" AS ENUM('female', 'male')`);
        await queryRunner.query(`CREATE TYPE "public"."profiles_activity_level_enum" AS ENUM('sedentary', 'light', 'moderate', 'active', 'very_active')`);
        await queryRunner.query(`CREATE TYPE "public"."profiles_goal_enum" AS ENUM('maintain', 'lose_0_25', 'lose_0_5', 'lose_0_75')`);
        await queryRunner.query(`CREATE TABLE "profiles" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "sex" "public"."profiles_sex_enum" NOT NULL, "birth_date" date NOT NULL, "height_cm" numeric(4,1) NOT NULL, "weight_kg" numeric(4,1) NOT NULL, "activity_level" "public"."profiles_activity_level_enum" NOT NULL, "goal" "public"."profiles_goal_enum" NOT NULL DEFAULT 'maintain', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_9e432b7df0d182f8d292902d1a" UNIQUE ("user_id"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "foods" ADD CONSTRAINT "FK_a9a8f9168af932fc2a0babedf63" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "log_entries" ADD CONSTRAINT "FK_9617f2245be230bf9c621167b5a" FOREIGN KEY ("daily_log_id") REFERENCES "daily_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "log_entries" ADD CONSTRAINT "FK_eb87b4e3d8ff4660d1bd5a13132" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "daily_logs" ADD CONSTRAINT "FK_f6adac8c3aaeebf26e9143c91f1" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2"`);
        await queryRunner.query(`ALTER TABLE "daily_logs" DROP CONSTRAINT "FK_f6adac8c3aaeebf26e9143c91f1"`);
        await queryRunner.query(`ALTER TABLE "log_entries" DROP CONSTRAINT "FK_eb87b4e3d8ff4660d1bd5a13132"`);
        await queryRunner.query(`ALTER TABLE "log_entries" DROP CONSTRAINT "FK_9617f2245be230bf9c621167b5a"`);
        await queryRunner.query(`ALTER TABLE "foods" DROP CONSTRAINT "FK_a9a8f9168af932fc2a0babedf63"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TYPE "public"."profiles_goal_enum"`);
        await queryRunner.query(`DROP TYPE "public"."profiles_activity_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."profiles_sex_enum"`);
        await queryRunner.query(`DROP TABLE "daily_logs"`);
        await queryRunner.query(`DROP TABLE "log_entries"`);
        await queryRunner.query(`DROP TABLE "foods"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
