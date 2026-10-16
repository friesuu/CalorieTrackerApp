import { MigrationInterface, QueryRunner } from "typeorm";

export class EntryUpdatedAt1792114659533 implements MigrationInterface {
    name = 'EntryUpdatedAt1792114659533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "log_entries" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "updated_at"`);
    }

}
