import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LoginAttempts } from './login-attempts.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]),
            JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('JWT_SECRET'),
                signOptions: { expiresIn: '30d' }, // the same as the cookie's maxAge
            }),
            }),
            UsersModule
          ],
  providers: [AuthService, AuthResolver, LoginAttempts],
  exports: [AuthService], // lets other modules use GqlAuthGuard, which needs it
})
export class AuthModule {}
