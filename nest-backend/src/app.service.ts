import {
    Injectable,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';

import { Todo } from './todo.entity.js';
import { User } from './user.entity.js';
import { CreateTodoDto, UpdateTodoDto } from './dto/todo.dto.js';

@Injectable()
export class AppService implements OnModuleInit {
    constructor(
        @InjectRepository(Todo)
        private readonly todoRepository: Repository<Todo>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly config: ConfigService,
    ) { }

    // Outside production, an empty database gets a demo account with two todos
    async onModuleInit() {
        if (this.config.get('NODE_ENV') === 'production') return;
        if (await this.userRepository.count()) return;

        const demo = await this.userRepository.save(
            this.userRepository.create({
                email: 'demo@example.com',
                password: await argon2.hash('password123'),
                role: 'user',
            }),
        );
        await this.todoRepository.save([
            { title: 'Stored in Docker PostgreSQL 🐘', status: 'Done', ownerId: demo.id },
            { title: 'Managed with TypeORM in NestJS 🦁', status: 'In Progress', ownerId: demo.id },
        ]);
    }

    getTodos(ownerId: string): Promise<Todo[]> {
        return this.todoRepository.find({ where: { ownerId }, order: { id: 'ASC' } });
    }

    // Admin view: every user's todos, with the owner's email
    getAllTodos(): Promise<Todo[]> {
        return this.todoRepository.find({
            relations: { owner: true },
            order: { id: 'ASC' },
        });
    }

    createTodo(ownerId: string, dto: CreateTodoDto): Promise<Todo> {
        const todo = this.todoRepository.create({
            title: dto.title.trim(),
            status: dto.status ?? 'To Do',
            ownerId,
        });
        return this.todoRepository.save(todo);
    }

    async updateTodo(ownerId: string, id: number, dto: UpdateTodoDto): Promise<Todo> {
        // Someone else's todo looks the same as a missing one
        const todo = await this.todoRepository.findOneBy({ id, ownerId });
        if (!todo) throw new NotFoundException(`Todo ${id} not found`);

        if (dto.title !== undefined) todo.title = dto.title.trim();
        if (dto.status !== undefined) todo.status = dto.status;
        return await this.todoRepository.save(todo);
    }

    async deleteTodo(ownerId: string, id: number): Promise<void> {
        const result = await this.todoRepository.delete({ id, ownerId });
        if (!result.affected) throw new NotFoundException(`Todo ${id} not found`);
    }
}
