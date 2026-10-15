import { MigrationInterface, QueryRunner } from "typeorm";

export class OptionalServing1792049406631 implements MigrationInterface {
    name = 'OptionalServing1792049406631'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "foods" ALTER COLUMN "serving_size" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "foods" ALTER COLUMN "serving_unit" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "log_entries" ALTER COLUMN "serving_size" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "log_entries" ALTER COLUMN "serving_unit" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "log_entries" ALTER COLUMN "serving_unit" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "log_entries" ALTER COLUMN "serving_size" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "foods" ALTER COLUMN "serving_unit" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "foods" ALTER COLUMN "serving_size" SET NOT NULL`);
    }

}
