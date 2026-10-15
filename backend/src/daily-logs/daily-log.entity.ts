import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
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

// One day of eating for one person. Made when the first thing is logged that day,
// so "a new day" at midnight is simply a new date: nothing is ever wiped.
@ObjectType()
@Entity('daily_logs')
@Unique(['ownerId', 'logDate']) // one log per person per day
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

  @Field(() => [LogEntry])
  @OneToMany(() => LogEntry, (entry) => entry.dailyLog)
  entries: LogEntry[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' }) // Many days belong to one user
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id', type: 'int', nullable: false })
  ownerId: number;
}
