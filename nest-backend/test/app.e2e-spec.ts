import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module.js';

// Runs against the real PostgreSQL from docker-compose.yml
describe('Auth and todos (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'correct horse';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.get(DataSource).query(`DELETE FROM users WHERE email LIKE 'e2e-%@example.com'`);
    await app.close();
  });

  const refreshCookie = (res: request.Response) =>
    ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('refresh_token='))!;

  it('rejects requests without a token', () => {
    return request(server).get('/todos').expect(401);
  });

  it('signs up, then 409s on the same email', async () => {
    const res = await request(server).post('/auth/signup').send({ email, password }).expect(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email, role: 'user' });
    expect(refreshCookie(res)).toMatch(/HttpOnly/);

    await request(server).post('/auth/signup').send({ email, password }).expect(409);
  });

  it('logs in and scopes todos to the user', async () => {
    await request(server).post('/auth/login').send({ email, password: 'wrong password' }).expect(401);
    const login = await request(server).post('/auth/login').send({ email, password }).expect(200);
    const auth = { Authorization: `Bearer ${login.body.accessToken}` };

    const created = await request(server).post('/todos').set(auth).send({ title: 'e2e todo' }).expect(201);
    expect(created.body).toMatchObject({ title: 'e2e todo', status: 'To Do', ownerId: login.body.user.id });

    const list = await request(server).get('/todos').set(auth).expect(200);
    expect(list.body.map((t: { id: number }) => t.id)).toEqual([created.body.id]);

    // A second user can't see or change it
    const other = await request(server)
      .post('/auth/signup')
      .send({ email: `e2e-other-${Date.now()}@example.com`, password })
      .expect(201);
    const otherAuth = { Authorization: `Bearer ${other.body.accessToken}` };
    expect((await request(server).get('/todos').set(otherAuth).expect(200)).body).toEqual([]);
    await request(server).patch(`/todos/${created.body.id}`).set(otherAuth).send({ status: 'Done' }).expect(404);
    await request(server).get('/admin/todos').set(otherAuth).expect(403);

    await request(server).post('/todos').set(auth).send({ title: 'x', status: 'Later' }).expect(400);
    await request(server).delete(`/todos/${created.body.id}`).set(auth).expect(204);
  });

  it('rotates the refresh token and rejects a reused one', async () => {
    const login = await request(server).post('/auth/login').send({ email, password }).expect(200);
    const first = refreshCookie(login);

    const refreshed = await request(server).post('/auth/refresh').set('Cookie', first).expect(200);
    const second = refreshCookie(refreshed);
    expect(second).not.toEqual(first);

    // Replaying the old cookie ends the session, so the new one stops working too
    await request(server).post('/auth/refresh').set('Cookie', first).expect(401);
    await request(server).post('/auth/refresh').set('Cookie', second).expect(401);
  });

  it('logout revokes the refresh token', async () => {
    const login = await request(server).post('/auth/login').send({ email, password }).expect(200);
    const cookie = refreshCookie(login);
    await request(server).post('/auth/logout').set('Cookie', cookie).expect(204);
    await request(server).post('/auth/refresh').set('Cookie', cookie).expect(401);
  });
});
