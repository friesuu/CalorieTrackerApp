import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { numericTransformer } from '../common/numeric.transformer';

// A food in a library, e.g. "Egg: 1 large = 72 kcal". Either a user's own (private) or a shared starter food.
@ObjectType()
@Entity('foods')
@Unique(['ownerId', 'name']) // the same name twice in one library would be confusing
// The rule above can't cover starter foods (owner_id is null, and null never equals null in SQL),
// so starter foods get their own rule: each name only once
@Index('UQ_foods_shared_name', ['name'], { unique: true, where: '"owner_id" IS NULL' })
export class Food {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ length: 100 })
  name: string;

  // One serving is servingSize + servingUnit, e.g. 1 "slice" or 250 "ml".
  // Both optional: a food without them is simply "1 serving" (e.g. a plate of nasi lemak).
  @Field(() => Float, { nullable: true })
  @Column({ name: 'serving_size', type: 'numeric', precision: 7, scale: 2, nullable: true, transformer: numericTransformer })
  servingSize: number | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'serving_unit', type: 'varchar', length: 30, nullable: true })
  servingUnit: string | null;

  @Field(() => Int)
  @Column({ name: 'kcal_per_serving', type: 'int' })
  kcalPerServing: number;

  // Macros are optional: null when you don't know them
  @Field(() => Float, { nullable: true })
  @Column({ name: 'protein_g', type: 'numeric', precision: 6, scale: 1, nullable: true, transformer: numericTransformer })
  proteinG: number | null;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'carbs_g', type: 'numeric', precision: 6, scale: 1, nullable: true, transformer: numericTransformer })
  carbsG: number | null;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'fat_g', type: 'numeric', precision: 6, scale: 1, nullable: true, transformer: numericTransformer })
  fatG: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Whose food it is. null = a shared starter food: everyone sees it, nobody can edit or delete it.
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' }) // Many foods belong to one user
  @JoinColumn({ name: 'owner_id' })
  owner: User | null;

  @Column({ name: 'owner_id', type: 'int', nullable: true })
  ownerId: number | null;

  // For the app: true = a starter food (worked out from ownerId, not stored)
  @Field()
  get shared(): boolean {
    return this.ownerId === null;
  }
}
