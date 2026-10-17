import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Todo } from './todo.entity.js';

// Same three statuses as the dropdown in the frontend (frontend/src/statuses.js)
export const STATUSES = ['To Do', 'In Progress', 'Done'];

// What the frontend sends in a POST or PATCH body
export interface TodoChanges {
    title?: unknown;
    status?: unknown;
}

@Injectable()
export class AppService implements OnModuleInit {
    constructor(
        // 👈 Dependency Injection gives you the PostgreSQL Todo table repository
        @InjectRepository(Todo)
        private readonly todoRepository: Repository<Todo>,
    ) { }

    // Inserts sample rows if the database is currently empty
    async onModuleInit() {
        const count = await this.todoRepository.count();
        if (count === 0) {
            await this.todoRepository.save([
                { title: 'Stored in Docker PostgreSQL 🐘', status: 'Done' },
                { title: 'Managed with TypeORM in NestJS 🦁', status: 'In Progress' },
            ]);
        }
    }

    // SELECT * FROM todos ORDER BY id ASC;
    async getTodos(): Promise<Todo[]> {
        return await this.todoRepository.find({
            order: { id: 'ASC' },
        });
    }

    // INSERT INTO todos (title, status) VALUES (...) RETURNING *;
    async createTodo(changes: TodoChanges): Promise<Todo> {
        const title = this.checkTitle(changes.title);
        const status = changes.status === undefined ? 'To Do' : this.checkStatus(changes.status);
        return await this.todoRepository.save(this.todoRepository.create({ title, status }));
    }

    // UPDATE todos SET title = ..., status = ... WHERE id = ...;
    async updateTodo(id: number, changes: TodoChanges): Promise<Todo> {
        const todo = await this.todoRepository.findOneBy({ id });
        if (!todo) throw new NotFoundException(`Todo ${id} not found`);

        if (changes.title !== undefined) todo.title = this.checkTitle(changes.title);
        if (changes.status !== undefined) todo.status = this.checkStatus(changes.status);
        return await this.todoRepository.save(todo);
    }

    // DELETE FROM todos WHERE id = ...;
    async deleteTodo(id: number): Promise<void> {
        const result = await this.todoRepository.delete(id);
        if (!result.affected) throw new NotFoundException(`Todo ${id} not found`);
    }

    private checkTitle(title: unknown): string {
        if (typeof title !== 'string' || !title.trim()) {
            throw new BadRequestException('title must be a non-empty string');
        }
        return title.trim();
    }

    private checkStatus(status: unknown): string {
        if (typeof status !== 'string' || !STATUSES.includes(status)) {
            throw new BadRequestException(`status must be one of: ${STATUSES.join(', ')}`);
        }
        return status;
    }
}
