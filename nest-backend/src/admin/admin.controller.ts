import { Controller, Get } from '@nestjs/common';
import { AppService } from '../app.service.js';
import { Roles } from '../auth/decorators.js';

@Controller('admin')
@Roles('admin')
export class AdminController {
    constructor(private readonly appService: AppService) { }

    // GET /admin/todos: everyone's todos
    @Get('todos')
    async getAllTodos() {
        const todos = await this.appService.getAllTodos();
        return todos.map(({ owner, ...todo }) => ({ ...todo, ownerEmail: owner.email }));
    }
}
