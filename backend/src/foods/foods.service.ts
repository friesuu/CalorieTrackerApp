import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Food } from './food.entity';
import { CreateFoodDto } from './create-food.dto';
import { UpdateFoodDto } from './update-food.dto';

@Injectable()
export class FoodsService {
  constructor(
    @InjectRepository(Food)
    private readonly foodsRepository: Repository<Food>,
  ) {}

  // Your library: the shared starter foods plus your own, A to Z. Never anyone else's.
  // (A list in `where` means OR: owned by you, or owned by nobody.)
  findAll(ownerId: number): Promise<Food[]> {
    return this.foodsRepository.find({
      where: [{ ownerId }, { ownerId: IsNull() }],
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  // A food you're allowed to use (log): your own or a starter food. Someone else's = not found.
  async findUsable(id: number, ownerId: number): Promise<Food> {
    const food = await this.foodsRepository.findOne({ where: [{ id, ownerId }, { id, ownerId: IsNull() }] });
    if (!food) {
      throw new NotFoundException(`Food ${id} not found`);
    }
    return food;
  }

  async create(dto: CreateFoodDto, ownerId: number): Promise<Food> {
    // Checked first, so we never build a food we're about to refuse.
    // (The database also refuses duplicates, but this gives a readable message.)
    await this.checkNameFree(dto.name, ownerId);

    const food = this.foodsRepository.create(dto);
    food.ownerId = ownerId;
    return this.foodsRepository.save(food);
  }

  // Days you've already logged this food on don't change: their entries have their own copy.
  async update(id: number, dto: UpdateFoodDto, ownerId: number): Promise<Food> {
    const food = await this.findOwn(id, ownerId);

    // PartialType lets every field be left out, which is fine. But these two can't be emptied (null).
    if (dto.name === null || dto.kcalPerServing === null) {
      throw new BadRequestException('Name and calories cannot be empty');
    }

    // Renaming to the name of ANOTHER food in your library is refused (keeping its own name is fine)
    if (dto.name !== undefined && dto.name !== food.name) {
      await this.checkNameFree(dto.name, ownerId);
    }

    this.foodsRepository.merge(food, dto);
    return this.foodsRepository.save(food);
  }

  // Past log entries of this food stay: their food_id becomes null (ON DELETE SET NULL),
  // and they still have their own copy of the name and calories.
  async remove(id: number, ownerId: number): Promise<void> {
    const food = await this.findOwn(id, ownerId);
    await this.foodsRepository.remove(food);
  }

  // A food you may change: only your own. A starter food is shared with everyone, so it's refused;
  // someone else's food is "not found", the same as a wrong id (it doesn't even say it exists).
  private async findOwn(id: number, ownerId: number): Promise<Food> {
    const food = await this.findUsable(id, ownerId);
    if (food.shared) {
      throw new ForbiddenException("Starter foods are shared with everyone, so they can't be changed");
    }
    return food;
  }

  // A name can't be used twice in one library: not by your own foods, and not by a starter food
  private async checkNameFree(name: string, ownerId: number): Promise<void> {
    const taken = await this.foodsRepository.findOne({ where: [{ ownerId, name }, { ownerId: IsNull(), name }] });
    if (!taken) return;

    throw new ConflictException(
      taken.shared ? `"${name}" is already one of the starter foods` : `You already have a food called "${name}"`,
    );
  }
}
