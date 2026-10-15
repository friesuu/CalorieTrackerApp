import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { LogEntry } from './log-entry.entity';
import { entryKcal } from './totals';

// Only adds the worked-out `kcal` field to LogEntry (entries are fetched through DailyLogsResolver)
@Resolver(() => LogEntry)
export class LogEntriesResolver {
  @ResolveField(() => Int)
  kcal(@Parent() entry: LogEntry): number {
    return entryKcal(entry);
  }
}
