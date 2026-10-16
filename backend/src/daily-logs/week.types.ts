import { Field, Int, ObjectType } from '@nestjs/graphql';

// One day in the weekly history. Not a database table: built from daily_logs + log_entries when asked.
@ObjectType()
export class DaySummary {
  @Field()
  date: string;

  @Field(() => Int)
  eatenKcal: number;

  // The target that day (saved when the day was first logged). null = nothing was ever logged that day.
  @Field(() => Int, { nullable: true })
  targetKcal: number | null;

  // Something was eaten and logged that day. A day whose entries were all removed counts as not logged.
  @Field()
  logged: boolean;
}

// The 7 days ending on endDate, oldest first
@ObjectType()
export class Week {
  @Field()
  startDate: string;

  @Field()
  endDate: string;

  @Field(() => [DaySummary])
  days: DaySummary[];

  @Field(() => Int)
  loggedDays: number;

  // Averages over the LOGGED days only: a day you didn't log isn't a day you ate 0.
  // null when no day was logged.
  @Field(() => Int, { nullable: true })
  averageKcal: number | null;

  @Field(() => Int, { nullable: true })
  averageTargetKcal: number | null;
}
