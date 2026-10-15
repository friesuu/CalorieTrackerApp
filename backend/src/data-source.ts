import { DataSource } from 'typeorm';
import { join } from 'path';

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
  // The CLI runs the compiled files in dist/, so these find the .js versions
  entities: [join(__dirname, '**', '*.entity.js')],
  migrations: [join(__dirname, 'migrations', '*.js')],
});
