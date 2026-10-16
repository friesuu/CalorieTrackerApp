import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Signing up (called by AuthService.register, with the password already hashed).
  // The very FIRST sign-up takes over the user from before accounts existed, with its profile, foods and
  // days, so nothing logged before accounts is lost. That can only happen once: afterwards no user without
  // an email is left. Every later sign-up is a new, empty account.
  createAccount(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    return this.usersRepository.manager.transaction(async (manager) => {
      // pessimistic_write locks the row until the transaction ends, so two sign-ups at the same moment
      // can't both take it over: the second waits, then finds it already has an email.
      const legacy = await manager.findOne(User, {
        where: { email: IsNull() },
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });
      if (legacy) {
        manager.merge(User, legacy, data);
        return manager.save(legacy);
      }
      return manager.save(manager.create(User, data));
    });
  }
}
