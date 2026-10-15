import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Food } from '../foods/food.entity';
import { BASIC_FOODS } from '../foods/basic-foods';

@Injectable()
export class UsersService {
  // The one user's id, once known. Kept as a promise so requests that arrive together
  // (the page loads several things at once) share one lookup instead of each creating a user.
  private defaultUserId: Promise<number> | null = null;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Single-user mode: every request belongs to the same user, made on first use.
  // When login is added, the guard reads the user from the login cookie instead.
  async defaultUser(): Promise<User> {
    this.defaultUserId ??= this.findOrCreateDefaultUserId();
    try {
      return await this.usersRepository.findOneByOrFail({ id: await this.defaultUserId });
    } catch (err) {
      this.defaultUserId = null; // e.g. the tables don't exist yet: look again next time
      throw err;
    }
  }

  private async findOrCreateDefaultUserId(): Promise<number> {
    const [first] = await this.usersRepository.find({ order: { id: 'ASC' }, take: 1 });
    if (first) return first.id;

    const created = await this.create();
    return created.id;
  }

  // A new user gets a few basic foods, so the library isn't completely empty on day one.
  // In a transaction: never a user without their foods, or foods without a user.
  create(): Promise<User> {
    return this.usersRepository.manager.transaction(async (manager) => {
      const user = await manager.save(manager.create(User, {}));
      await manager.save(BASIC_FOODS.map((food) => manager.create(Food, { ...food, ownerId: user.id })));
      return user;
    });
  }
}
