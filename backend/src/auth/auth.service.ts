import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RegisterDto } from './register.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './login.dto';
import { ChangePasswordDto } from './change-password.dto';
import { UsersService } from '../users/users.service';
import { LoginAttempts } from './login-attempts.service';

@Injectable()
export class AuthService {
  // A real argon2 hash of a throwaway string, so "no such user" takes as long as "wrong password"
  private readonly dummyHash = argon2.hash('not-a-real-password');

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly loginAttempts: LoginAttempts,
  ) {}

  async register(dto: RegisterDto): Promise<{user: User; token: string}> {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email is already registered');

    // .hash is slow on purpose: fine for one login, very slow for an attacker trying millions of passwords
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.createAccount({ name: dto.name, email: dto.email, passwordHash });
    return {user, token: await this.signToken(user)};
  }

  async login(dto: LoginDto): Promise<{ user: User; token: string }> {
    this.loginAttempts.assertAllowed(dto.email); // refused while locked (3 wrong passwords in a minute)
    const user = await this.usersRepository.findOneBy({ email: dto.email });
    const valid = await argon2.verify(user?.passwordHash ?? await this.dummyHash, dto.password);
    if (!user || !valid) {
      this.loginAttempts.recordWrong(dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.loginAttempts.clear(dto.email); // a correct password starts the count again
    return { user, token: await this.signToken(user) };
  }

  async userFromToken(token?: string): Promise<User> {
    if (!token) throw new UnauthorizedException();
    try {
      const { sub, ver } = await this.jwtService.verifyAsync<{ sub: number; ver?: number }>(token);
      const user = await this.usersRepository.findOneBy({ id: sub });
      // The token must be from the CURRENT password: after a password change, tokenVersion has gone up,
      // so tokens made before it (another device, or a stolen copy) no longer match.
      if (user && user.tokenVersion === ver) return user;
    } catch {
      // forged or expired token: fall through
    }
    throw new UnauthorizedException();
  }

  // Returns a fresh token, so the person who changed the password stays logged in on THIS device
  async changePassword(user: User, dto: ChangePasswordDto): Promise<string> {
    if (!user.passwordHash) throw new UnauthorizedException(); // only the user from before accounts has none

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    // BadRequest, not Unauthorized: the frontend treats "unauthenticated" as "session expired" and logs you out
    if (!valid) throw new BadRequestException('Current password is incorrect');
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('New password must be different from the current one');
    }

    user.passwordHash = await argon2.hash(dto.newPassword);
    user.tokenVersion += 1; // every token made before this moment stops working
    await this.usersRepository.save(user);

    return this.signToken(user);
  }

  // The login token: who you are (sub) and which password "generation" it belongs to (ver)
  private signToken(user: User): Promise<string> {
    return this.jwtService.signAsync({ sub: user.id, ver: user.tokenVersion });
  }
}
