import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Todo } from './todo.entity.js';

// A tiny in-memory stand-in for the Postgres todos table
function fakeTodoRepository() {
  let rows: Todo[] = [];
  let nextId = 1;
  return {
    find: async () => [...rows],
    findOneBy: async ({ id }: { id: number }) => rows.find((t) => t.id === id) ?? null,
    count: async () => rows.length,
    create: (data: Partial<Todo>) => ({ ...data }) as Todo,
    save: async (todo: Todo) => {
      if (!todo.id) {
        Object.assign(todo, { id: nextId++, createdAt: new Date() });
        rows.push(todo);
      }
      return todo;
    },
    delete: async (id: number) => {
      const before = rows.length;
      rows = rows.filter((t) => t.id !== id);
      return { affected: before - rows.length };
    },
  };
}

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: getRepositoryToken(Todo), useValue: fakeTodoRepository() }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('creates a todo, defaulting the status to To Do', async () => {
    const todo = await appController.createTodo({ title: '  Buy milk  ' });
    expect(todo).toMatchObject({ id: 1, title: 'Buy milk', status: 'To Do' });
    expect(await appController.getTodos()).toHaveLength(1);
  });

  it('rejects a blank title or an unknown status', async () => {
    await expect(appController.createTodo({ title: '   ' })).rejects.toThrow(BadRequestException);
    await expect(appController.createTodo({ title: 'x', status: 'Later' })).rejects.toThrow(BadRequestException);
  });

  it('updates only the fields that were sent', async () => {
    const { id } = await appController.createTodo({ title: 'Buy milk' });
    const todo = await appController.updateTodo(id, { status: 'Done' });
    expect(todo).toMatchObject({ title: 'Buy milk', status: 'Done' });
  });

  it('deletes a todo, then 404s on the same id', async () => {
    const { id } = await appController.createTodo({ title: 'Buy milk' });
    await appController.deleteTodo(id);
    expect(await appController.getTodos()).toHaveLength(0);
    await expect(appController.deleteTodo(id)).rejects.toThrow(NotFoundException);
    await expect(appController.updateTodo(id, { title: 'x' })).rejects.toThrow(NotFoundException);
  });
});
