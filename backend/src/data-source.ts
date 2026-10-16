import { DataSource } from 'typeorm';
import { extname, join } from 'path';

// Only used by the TypeORM command line (npm run migration:...). That runs outside Nest,
// so it reads .env itself instead of going through ConfigModule.
process.loadEnvFile();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // The migration commands run this file straight from src/ (ts-node), so these find the .ts files.
  // extname: '.ts' there, '.js' if it's ever run from dist/ (where *.ts would also match the .d.ts files).
  entities: [join(__dirname, '**', `*.entity${extname(__filename)}`)],
  migrations: [join(__dirname, 'migrations', `*${extname(__filename)}`)],
});
