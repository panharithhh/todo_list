import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AppService } from './app.service.js';
import type { TodoChanges } from './app.service.js';

@Controller('todos')
export class AppController {
    constructor(private readonly appService: AppService) { }

    // GET /todos
    @Get()
    async getTodos() {
        return await this.appService.getTodos();
    }

    // POST /todos  { "title": "...", "status": "To Do" }
    @Post()
    async createTodo(@Body() body: TodoChanges = {}) {
        return await this.appService.createTodo(body);
    }

    // PATCH /todos/5  { "title": "..." } or { "status": "Done" }
    @Patch(':id')
    async updateTodo(@Param('id', ParseIntPipe) id: number, @Body() body: TodoChanges = {}) {
        return await this.appService.updateTodo(id, body);
    }

    // DELETE /todos/5
    @Delete(':id')
    @HttpCode(204)
    async deleteTodo(@Param('id', ParseIntPipe) id: number) {
        await this.appService.deleteTodo(id);
    }
}
