import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Food } from './food.entity';
import { CreateFoodDto } from './create-food.dto';

@Injectable()
export class FoodsService {
  constructor(
    @InjectRepository(Food)
    private readonly foodsRepository: Repository<Food>,
  ) {}

  // The whole library, A to Z. The page searches it in the browser, so it's loaded once.
  findAll(ownerId: number): Promise<Food[]> {
    return this.foodsRepository.find({
      where: { ownerId },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async create(dto: CreateFoodDto, ownerId: number): Promise<Food> {
    // Checked first, so we never build a food we're about to refuse.
    // (The database also refuses duplicates, but this gives a readable message.)
    const duplicate = await this.foodsRepository.findOneBy({ ownerId, name: dto.name });
    if (duplicate) {
      throw new ConflictException(`You already have a food called "${dto.name}"`);
    }

    const food = this.foodsRepository.create(dto);
    food.ownerId = ownerId;
    return this.foodsRepository.save(food);
  }

  // Past log entries of this food stay: their food_id becomes null (ON DELETE SET NULL),
  // and they still have their own copy of the name and calories.
  async remove(id: number, ownerId: number): Promise<void> {
    const result = await this.foodsRepository.delete({ id, ownerId });

    if (result.affected === 0) {
      throw new NotFoundException(`Food ${id} not found`);
    }
  }
}
