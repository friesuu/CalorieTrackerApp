import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { extname, join } from 'path';
import type { Request, Response } from 'express';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { FoodsModule } from './foods/foods.module';
import { DailyLogsModule } from './daily-logs/daily-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow('DB_PORT')),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        // Tables are made by migrations (npm run migration:run), never changed automatically on start
        synchronize: false,
        // Only the tests run these (the app never runs migrations by itself).
        // .ts when the tests run the source, .js in dist/ (where *.ts would also match the .d.ts files).
        migrations: [join(__dirname, 'migrations', `*${extname(__filename)}`)],
        logging: true,
      }),
    }),
    UsersModule,
    ProfilesModule,
    FoodsModule,
    DailyLogsModule,
  ],
})
export class AppModule {}
