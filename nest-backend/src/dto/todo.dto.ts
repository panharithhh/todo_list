import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const STATUSES = ['To Do', 'In Progress', 'Done'] as const;
export type TodoStatus = (typeof STATUSES)[number];

export class CreateTodoDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  title: string;

  @IsOptional()
  @IsIn(STATUSES, { message: `Status must be one of: ${STATUSES.join(', ')}` })
  status?: string;
}

export class UpdateTodoDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  title?: string;

  @IsOptional()
  @IsIn(STATUSES, { message: `Status must be one of: ${STATUSES.join(', ')}` })
  status?: string;
}
