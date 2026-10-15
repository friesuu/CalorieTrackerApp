import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// One row per person. For now there is exactly one (made on first use, see UsersService).
// Login can be added later by adding email and password_hash here, like the task board's users table:
// every other table already points at a user.
@ObjectType()
@Entity('users')
export class User {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  // Decides when this person's day starts and ends (midnight in this time zone)
  @Field()
  @Column({ length: 50, default: 'Asia/Kuala_Lumpur' })
  timezone: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
