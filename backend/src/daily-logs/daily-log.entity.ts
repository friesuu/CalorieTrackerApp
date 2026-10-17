import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { LogEntry } from './log-entry.entity';
import { Exercise } from './exercise.entity';
import { SPLIT_ADDS_UP } from '../profiles/meal-split';

// One day of eating for one person. Made when the first thing is logged that day,
// so "a new day" at midnight is simply a new date: nothing is ever wiped.
@ObjectType()
@Entity('daily_logs')
@Unique(['ownerId', 'logDate']) // one log per person per day
@Check('CHK_daily_logs_split_adds_up', SPLIT_ADDS_UP)
export class DailyLog {
  @PrimaryGeneratedColumn()
  id: number;

  // The calendar day in the user's time zone, e.g. '2026-10-15'
  @Field(() => String, { name: 'date' })
  @Column({ name: 'log_date', type: 'date' })
  logDate: string;

  // The target on that day. Saved, so changing your goal later doesn't re-judge past days.
  @Field(() => Int)
  @Column({ name: 'target_kcal', type: 'int' })
  targetKcal: number;

  // The meal split that day, copied from the profile when the day is made (like targetKcal), so
  // changing your split later doesn't change past days. Days from before meals existed got the default.
  @Column({ name: 'breakfast_pct', type: 'int', default: 25 })
  breakfastPct: number;

  @Column({ name: 'lunch_pct', type: 'int', default: 35 })
  lunchPct: number;

  @Column({ name: 'dinner_pct', type: 'int', default: 30 })
  dinnerPct: number;

  @Column({ name: 'snack_pct', type: 'int', default: 10 })
  snackPct: number;

  // Add the calories burned in exercise to this day's budget? Copied from the profile setting when the day
  // is made (like targetKcal), so turning it on or off later doesn't re-judge past days.
  @Field()
  @Column({ name: 'exercise_in_budget', type: 'boolean', default: false })
  exerciseInBudget: boolean;

  @Field(() => [LogEntry])
  @OneToMany(() => LogEntry, (entry) => entry.dailyLog)
  entries: LogEntry[];

  @Field(() => [Exercise])
  @OneToMany(() => Exercise, (exercise) => exercise.dailyLog)
  exercises: Exercise[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' }) // Many days belong to one user
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id', type: 'int', nullable: false })
  ownerId: number;
}
