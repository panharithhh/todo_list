import { DataSourceOptions } from 'typeorm';
import { Todo } from './todo.entity.js';
import { User } from './user.entity.js';
import { AddUsersAndTodoOwner1761300000000 } from './migrations/1761300000000-AddUsersAndTodoOwner.js';

// Shared by AppModule. The schema comes from migrations, not synchronize,
// and pending migrations run when the app starts.
export function dataSourceOptions(env: (key: string) => string | undefined): DataSourceOptions {
  return {
    type: 'postgres',
    host: env('DB_HOST') ?? 'localhost',
    port: Number(env('DB_PORT') ?? 5432),
    username: env('DB_USERNAME') ?? 'postgres',
    password: env('DB_PASSWORD') ?? 'postgrespassword',
    database: env('DB_NAME') ?? 'tododb',
    entities: [Todo, User],
    migrations: [AddUsersAndTodoOwner1761300000000],
    migrationsRun: true,
    synchronize: false,
  };
}
