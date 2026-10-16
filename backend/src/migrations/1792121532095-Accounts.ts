import { MigrationInterface, QueryRunner } from "typeorm";

// The starter foods, written out here (not imported from the app): a migration must keep doing exactly
// what it did on the day it was written, even if the app's code changes later.
const STARTERS = `('Egg', 1::numeric, 'large', 72),
            ('White rice, cooked', 1::numeric, 'cup', 205),
            ('White bread', 1::numeric, 'slice', 75),
            ('Banana', 1::numeric, 'medium', 105),
            ('Apple', 1::numeric, 'medium', 95),
            ('Full cream milk', 250::numeric, 'ml', 155)`;

export class Accounts1792121532095 implements MigrationInterface {
    name = 'Accounts1792121532095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying(254)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "token_version" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "foods" DROP CONSTRAINT "FK_a9a8f9168af932fc2a0babedf63"`);
        await queryRunner.query(`ALTER TABLE "foods" DROP CONSTRAINT "UQ_1983e7d28be864adc8566f6e46d"`);
        await queryRunner.query(`ALTER TABLE "foods" ALTER COLUMN "owner_id" DROP NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_foods_shared_name" ON "foods"  ("name") WHERE "owner_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "foods" ADD CONSTRAINT "UQ_1983e7d28be864adc8566f6e46d" UNIQUE ("owner_id", "name")`);
        await queryRunner.query(`ALTER TABLE "foods" ADD CONSTRAINT "FK_a9a8f9168af932fc2a0babedf63" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // ---- Written by hand (generate only knows about structure, not data) ----
        // The starter foods become shared (owner_id NULL) instead of a copy per user.
        // 1. The existing user's UNCHANGED copy of each starter food becomes the shared one, so the days
        //    it was logged on stay linked to it. (MIN(id): one per name, in case there were two copies.)
        await queryRunner.query(`
            UPDATE "foods" SET "owner_id" = NULL
            WHERE "id" IN (
                SELECT MIN("id") FROM "foods"
                WHERE ("name", "serving_size", "serving_unit", "kcal_per_serving") IN (VALUES
            ${STARTERS})
                  AND "protein_g" IS NULL AND "carbs_g" IS NULL AND "fat_g" IS NULL
                GROUP BY "name"
            )`);
        // 2. Any starter food that isn't there yet is added (on a new, empty database: all of them)
        await queryRunner.query(`
            INSERT INTO "foods" ("name", "serving_size", "serving_unit", "kcal_per_serving")
            SELECT v.* FROM (VALUES
            ${STARTERS}) AS v("name", "serving_size", "serving_unit", "kcal_per_serving")
            WHERE NOT EXISTS (SELECT 1 FROM "foods" f WHERE f."owner_id" IS NULL AND f."name" = v."name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // ---- Written by hand: undo the shared foods first, because owner_id is about to be required again ----
        // Shared foods go back to the first user; with no user at all, they're removed.
        await queryRunner.query(`UPDATE "foods" SET "owner_id" = (SELECT MIN("id") FROM "users") WHERE "owner_id" IS NULL`);
        await queryRunner.query(`DELETE FROM "foods" WHERE "owner_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "foods" DROP CONSTRAINT "FK_a9a8f9168af932fc2a0babedf63"`);
        await queryRunner.query(`ALTER TABLE "foods" DROP CONSTRAINT "UQ_1983e7d28be864adc8566f6e46d"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_foods_shared_name"`);
        await queryRunner.query(`ALTER TABLE "foods" ALTER COLUMN "owner_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "foods" ADD CONSTRAINT "UQ_1983e7d28be864adc8566f6e46d" UNIQUE ("name", "owner_id")`);
        await queryRunner.query(`ALTER TABLE "foods" ADD CONSTRAINT "FK_a9a8f9168af932fc2a0babedf63" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "token_version"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    }

}
