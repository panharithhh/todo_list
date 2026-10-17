import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Todo } from './todo.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgrespassword',
      database: 'tododb',
      entities: [Todo],
      synchronize: true, // 👈 THIS creates the table in Postgres automatically!
    }),
    TypeOrmModule.forFeature([Todo]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
