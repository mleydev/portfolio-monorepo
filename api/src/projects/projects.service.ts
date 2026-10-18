import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectsService {
  findAll() {
    return {
      message: 'Projects API is working',
      data: [],
    };
  }
}
