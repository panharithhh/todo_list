import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

// Runs against the real PostgreSQL from docker-compose.yml
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/todos (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/todos').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('creates, updates and deletes a todo', async () => {
    const server = app.getHttpServer();
    const created = await request(server).post('/todos').send({ title: 'e2e todo' }).expect(201);
    expect(created.body).toMatchObject({ title: 'e2e todo', status: 'To Do' });

    const updated = await request(server).patch(`/todos/${created.body.id}`).send({ status: 'Done' }).expect(200);
    expect(updated.body.status).toBe('Done');

    await request(server).delete(`/todos/${created.body.id}`).expect(204);
    await request(server).delete(`/todos/${created.body.id}`).expect(404);
  });

  it('rejects a bad status', () => {
    return request(app.getHttpServer()).post('/todos').send({ title: 'x', status: 'Later' }).expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
