import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AdminController } from './admin/admin.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard, RolesGuard } from './auth/guards.js';
import { dataSourceOptions } from './data-source.js';
import { Todo } from './todo.entity.js';
import { User } from './user.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get('THROTTLE_TTL', 60000)), // window in ms
          limit: Number(config.get('THROTTLE_LIMIT', 100)), // requests per window per IP
        },
      ],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => dataSourceOptions((key) => config.get<string>(key)),
    }),

    TypeOrmModule.forFeature([Todo, User]),
    AuthModule,
  ],
  controllers: [AppController, AdminController],
  providers: [
    AppService,
    // Global guards run in this order: rate limit, then JWT (skipped by @Public()), then @Roles()
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
