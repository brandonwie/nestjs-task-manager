import { InternalServerErrorException, Logger } from '@nestjs/common';
import { User } from '../auth/user.entity';
import { EntityRepository, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  private logger = new Logger('TaskRepository');

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;
    const query = this.createQueryBuilder('task');

    query.where('task.userId = :id', { id: user.id });

    if (status) {
      console.log('status exist');
      query.andWhere('task.status = :status', {
        status,
      });
    }

    if (search) {
      //! NEED TO BE EXTRA CAREFUL WITH PARENTHESIS
      query.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    try {
      const tasks = query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to get tasks from user "${user.username}", DOT: ${
          (JSON.stringify(filterDto), error.stack)
        }`,
      );
      throw new InternalServerErrorException();
    }
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = new Task();
    task.title = title;
    task.description = description;
    task.status = TaskStatus.OPEN;
    task.user = user;

    try {
      await task.save();
      return task;
    } catch (error) {
      this.logger.error(
        `Failed to create a task for user "${user.username}". Data: ${createTaskDto}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
