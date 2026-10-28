import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { CreateTodoDto, UpdateTodoDto } from './dto/todo.dto.js';
import { CurrentUser, type AuthUser } from './auth/decorators.js';

// Every route here sees only the signed-in user's todos
@Controller('todos')
export class AppController {
    constructor(private readonly appService: AppService) { }

    // GET /todos
    @Get()
    async getTodos(@CurrentUser() user: AuthUser) {
        return await this.appService.getTodos(user.id);
    }

    // POST /todos
    @Post()
    async createTodo(@CurrentUser() user: AuthUser, @Body() body: CreateTodoDto) {
        return await this.appService.createTodo(user.id, body);
    }

    // PATCH /todos/:id
    @Patch(':id')
    async updateTodo(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateTodoDto,
    ) {
        return await this.appService.updateTodo(user.id, id, body);
    }

    // DELETE /todos/:id
    @Delete(':id')
    @HttpCode(204)
    async deleteTodo(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
        await this.appService.deleteTodo(user.id, id);
    }
}
