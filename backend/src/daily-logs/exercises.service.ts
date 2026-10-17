import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './exercise.entity';
import { DailyLog } from './daily-log.entity';
import { AddExerciseDto, ExerciseDto } from './exercise.dto';
import { DailyLogsService } from './daily-logs.service';
import { User } from '../users/user.entity';

// Logging, changing and removing exercise. Like the log entries, each change returns the whole day,
// because the budget and what's left both depend on it.
@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exercisesRepository: Repository<Exercise>,
    private readonly dailyLogsService: DailyLogsService, // finds and makes days, the same way as for food
  ) {}

  async add(dto: AddExerciseDto, user: User): Promise<DailyLog> {
    const day = await this.dailyLogsService.dayToLogOn(user, dto.date);
    await this.exercisesRepository.save(
      this.exercisesRepository.create({
        dailyLogId: day.id,
        name: dto.name,
        minutes: dto.minutes ?? null,
        kcal: dto.kcal,
      }),
    );
    return this.dailyLogsService.findDay(user, day.logDate);
  }

  // All three are sent again (the edit form shows them all), so leaving out minutes clears it
  async update(id: number, dto: ExerciseDto, user: User): Promise<DailyLog> {
    const exercise = await this.findOwn(id, user);
    exercise.name = dto.name;
    exercise.minutes = dto.minutes ?? null;
    exercise.kcal = dto.kcal;
    await this.exercisesRepository.save(exercise);
    return this.dailyLogsService.findDay(user, exercise.dailyLog.logDate);
  }

  async remove(id: number, user: User): Promise<DailyLog> {
    const exercise = await this.findOwn(id, user);
    await this.exercisesRepository.remove(exercise);
    return this.dailyLogsService.findDay(user, exercise.dailyLog.logDate);
  }

  // Only your own: an id from someone else's day is "not found", the same as a wrong id
  private async findOwn(id: number, user: User): Promise<Exercise> {
    const exercise = await this.exercisesRepository.findOne({
      where: { id, dailyLog: { ownerId: user.id } },
      relations: { dailyLog: true },
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise ${id} not found`);
    }
    return exercise;
  }
}
