import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds the users table and gives every todo an owner.
// Written with IF NOT EXISTS so it also runs on databases that were built
// earlier by `synchronize` (todos already there, maybe a userId column).
export class AddUsersAndTodoOwner1761300000000 implements MigrationInterface {
  name = 'AddUsersAndTodoOwner1761300000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )`);
    await q.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refreshTokenHash" character varying`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "todos" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'To Do',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_todos_id" PRIMARY KEY ("id")
      )`);

    // Older builds called the owner column userId
    const [{ has_user_id }] = await q.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'todos' AND column_name = 'userId'
      ) AS has_user_id`);
    if (has_user_id) {
      await q.query(`ALTER TABLE "todos" DROP CONSTRAINT IF EXISTS "FK_4583be7753873b4ead956f040e3"`);
      await q.query(`ALTER TABLE "todos" RENAME COLUMN "userId" TO "ownerId"`);
    } else {
      await q.query(`ALTER TABLE "todos" ADD COLUMN IF NOT EXISTS "ownerId" uuid`);
    }

    // A todo without an owner can't be reached by anyone once queries are scoped
    await q.query(`DELETE FROM "todos" WHERE "ownerId" IS NULL`);
    await q.query(`ALTER TABLE "todos" ALTER COLUMN "ownerId" SET NOT NULL`);
    await q.query(`
      ALTER TABLE "todos" ADD CONSTRAINT "FK_todos_owner"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_todos_owner" ON "todos" ("ownerId")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "IDX_todos_owner"`);
    await q.query(`ALTER TABLE "todos" DROP CONSTRAINT IF EXISTS "FK_todos_owner"`);
    await q.query(`ALTER TABLE "todos" DROP COLUMN "ownerId"`);
    await q.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "refreshTokenHash"`);
  }
}
