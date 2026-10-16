import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// One account. Everything else (profile, foods, days) points at a user.
@ObjectType()
@Entity('users')
export class User {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  // The three below are only empty (null) for the one user from before accounts existed,
  // until the first sign-up takes it over. Every account made by signing up has them.
  @Field(() => String)
  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string | null;

  @Field(() => String)
  @Column({ type: 'varchar', length: 254, unique: true, nullable: true }) // the database refuses the same email twice
  email: string | null;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true }) // no @Field: in the database, never in the API
  passwordHash: string | null;

  // Goes up by 1 every time the password changes. Each login token remembers the number it was
  // made with, so tokens made before a password change stop working (other devices get logged out).
  // No @Field: the API never shows it. (Same as the task board.)
  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion: number;

  // Decides when this person's day starts and ends (midnight in this time zone)
  @Field()
  @Column({ length: 50, default: 'Asia/Kuala_Lumpur' })
  timezone: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
