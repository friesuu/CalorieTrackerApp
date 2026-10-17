import { Field, Float, ObjectType } from '@nestjs/graphql';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Sex } from './sex.enum';
import { ActivityLevel } from './activity-level.enum';
import { Goal } from './goal.enum';
import { numericTransformer } from '../common/numeric.transformer';
import { SPLIT_ADDS_UP } from './meal-split';

// Your body stats, used to work out the calorie target. One per user.
// No row yet = the app shows the first-run screen.
@ObjectType()
@Entity('profiles')
@Check('CHK_profiles_split_adds_up', SPLIT_ADDS_UP)
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' }) // One profile per user (also makes user_id unique)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Field(() => Sex)
  @Column({ type: 'enum', enum: Sex })
  sex: Sex;

  // Stored instead of age, so the age (and the target) stays right after a birthday
  @Field()
  @Column({ name: 'birth_date', type: 'date' })
  birthDate: string;

  @Field(() => Float)
  @Column({ name: 'height_cm', type: 'numeric', precision: 4, scale: 1, transformer: numericTransformer })
  heightCm: number;

  @Field(() => Float)
  @Column({ name: 'weight_kg', type: 'numeric', precision: 4, scale: 1, transformer: numericTransformer })
  weightKg: number;

  @Field(() => ActivityLevel)
  @Column({ name: 'activity_level', type: 'enum', enum: ActivityLevel })
  activityLevel: ActivityLevel;

  @Field(() => Goal)
  @Column({ type: 'enum', enum: Goal, default: Goal.MAINTAIN })
  goal: Goal;

  // How the target is shared out between the meals, in %. Shown through mealSplit (a field resolver).
  @Column({ name: 'breakfast_pct', type: 'int', default: 25 })
  breakfastPct: number;

  @Column({ name: 'lunch_pct', type: 'int', default: 35 })
  lunchPct: number;

  @Column({ name: 'dinner_pct', type: 'int', default: 30 })
  dinnerPct: number;

  @Column({ name: 'snack_pct', type: 'int', default: 10 })
  snackPct: number;

  // "Add exercise calories to my daily budget". Off unless you turn it on: burn estimates from watches
  // and gym machines are often high, so eating them all back can cancel out the goal's deficit.
  @Field()
  @Column({ name: 'exercise_in_budget', type: 'boolean', default: false })
  exerciseInBudget: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
