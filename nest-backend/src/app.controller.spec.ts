import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import type { AuthUser } from './auth/decorators.js';
import { Todo } from './todo.entity.js';
import { User } from './user.entity.js';

type Where = Partial<Pick<Todo, 'id' | 'ownerId'>>;
const matches = (todo: Todo, where: Where = {}) =>
  Object.entries(where).every(([key, value]) => todo[key as keyof Todo] === value);

// A tiny in-memory stand-in for the Postgres todos table
function fakeTodoRepository() {
  let rows: Todo[] = [];
  let nextId = 1;
  return {
    find: async ({ where }: { where?: Where } = {}) => rows.filter((t) => matches(t, where)),
    findOneBy: async (where: Where) => rows.find((t) => matches(t, where)) ?? null,
    create: (data: Partial<Todo>) => ({ ...data }) as Todo,
    save: async (todo: Todo) => {
      if (!todo.id) {
        Object.assign(todo, { id: nextId++, createdAt: new Date() });
        rows.push(todo);
      }
      return todo;
    },
    delete: async (where: Where) => {
      const before = rows.length;
      rows = rows.filter((t) => !matches(t, where));
      return { affected: before - rows.length };
    },
  };
}

const alice: AuthUser = { id: 'alice-id', email: 'alice@example.com', role: 'user' };
const bob: AuthUser = { id: 'bob-id', email: 'bob@example.com', role: 'user' };

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getRepositoryToken(Todo), useValue: fakeTodoRepository() },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('creates a todo owned by the current user, defaulting the status to To Do', async () => {
    const todo = await appController.createTodo(alice, { title: '  Buy milk  ' });
    expect(todo).toMatchObject({ id: 1, title: 'Buy milk', status: 'To Do', ownerId: alice.id });
    expect(await appController.getTodos(alice)).toHaveLength(1);
  });

  it('only lists the current user\'s todos', async () => {
    await appController.createTodo(alice, { title: 'Alice todo' });
    await appController.createTodo(bob, { title: 'Bob todo' });
    const todos = await appController.getTodos(bob);
    expect(todos.map((t) => t.title)).toEqual(['Bob todo']);
  });

  it('updates only the fields that were sent', async () => {
    const { id } = await appController.createTodo(alice, { title: 'Buy milk' });
    const todo = await appController.updateTodo(alice, id, { status: 'Done' });
    expect(todo).toMatchObject({ title: 'Buy milk', status: 'Done' });
  });

  it('404s when someone else touches a todo', async () => {
    const { id } = await appController.createTodo(alice, { title: 'Buy milk' });
    await expect(appController.updateTodo(bob, id, { title: 'x' })).rejects.toThrow(NotFoundException);
    await expect(appController.deleteTodo(bob, id)).rejects.toThrow(NotFoundException);
    expect(await appController.getTodos(alice)).toHaveLength(1);
  });

  it('deletes a todo, then 404s on the same id', async () => {
    const { id } = await appController.createTodo(alice, { title: 'Buy milk' });
    await appController.deleteTodo(alice, id);
    expect(await appController.getTodos(alice)).toHaveLength(0);
    await expect(appController.deleteTodo(alice, id)).rejects.toThrow(NotFoundException);
  });
});
