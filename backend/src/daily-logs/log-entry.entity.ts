import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DailyLog } from './daily-log.entity';
import { Food } from '../foods/food.entity';
import { numericTransformer } from '../common/numeric.transformer';

// One thing you ate, e.g. "1.5 × Egg"
@ObjectType()
@Entity('log_entries')
export class LogEntry {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DailyLog, (log) => log.entries, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'daily_log_id' })
  dailyLog: DailyLog;

  @Column({ name: 'daily_log_id', type: 'int' })
  dailyLogId: number;

  // The library food it came from. Null for a quick add, or after that food is deleted
  // (SET NULL: deleting a food keeps your history).
  @ManyToOne(() => Food, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'food_id' })
  food: Food | null;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'food_id', type: 'int', nullable: true })
  foodId: number | null;

  // Everything from here to quantity is COPIED from the food when it's logged,
  // so editing or deleting the food later doesn't change what you ate on past days.
  @Field()
  @Column({ length: 100 })
  name: string;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'serving_size', type: 'numeric', precision: 7, scale: 2, nullable: true, transformer: numericTransformer })
  servingSize: number | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'serving_unit', type: 'varchar', length: 30, nullable: true })
  servingUnit: string | null;

  @Field(() => Int)
  @Column({ name: 'kcal_per_serving', type: 'int' })
  kcalPerServing: number;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'protein_g', type: 'numeric', precision: 6, scale: 1, nullable: true, transformer: numericTransformer })
  proteinG: number | null;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'carbs_g', type: 'numeric', precision: 6, scale: 1, nullable: true, transformer: numericTransformer })
  carbsG: number | null;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'fat_g', type: 'numeric', precision: 6, scale: 1, nullable: true, transformer: numericTransformer })
  fatG: number | null;

  // How many servings, e.g. 1.5
  @Field(() => Float)
  @Column({ type: 'numeric', precision: 6, scale: 2, transformer: numericTransformer })
  quantity: number;

  @Field()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Last change, e.g. more servings added to it. Recent foods are ordered by this.
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
