import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Todo } from './todo.entity.js';

export type Role = 'user' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // argon2 hash, never selected unless asked for
  @Column({ select: false })
  password: string;

  @Column({ type: 'varchar', default: 'user' })
  role: Role;

  // argon2 hash of the current refresh token; null after logout
  @Column({ type: 'varchar', nullable: true, select: false })
  refreshTokenHash: string | null;

  @OneToMany(() => Todo, (todo) => todo.owner)
  todos: Todo[];

  @CreateDateColumn()
  createdAt: Date;
}
