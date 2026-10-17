import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('todos') // 👈 Name of the table in PostgreSQL
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: 'To Do' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
