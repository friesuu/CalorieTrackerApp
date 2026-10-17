import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DailyLog } from './daily-log.entity';

// Exercise on a day, e.g. "Running, 30 min, 250 kcal". Everything is typed in by you:
// nothing estimates the calories (they come from your watch, an app, or the machine at the gym).
@ObjectType()
@Entity('exercises')
export class Exercise {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DailyLog, (log) => log.exercises, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'daily_log_id' })
  dailyLog: DailyLog;

  @Column({ name: 'daily_log_id', type: 'int' })
  dailyLogId: number;

  @Field()
  @Column({ length: 100 })
  name: string;

  // Optional: some apps only tell you the calories
  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  minutes: number | null;

  // Calories burned
  @Field(() => Int)
  @Column({ type: 'int' })
  kcal: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
