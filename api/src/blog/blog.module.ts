import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BlogController } from './blog.controller';
import { BlogAdminController } from './blog.admin.controller';
import {
  BlogCategoriesAdminController,
  BlogTagsAdminController,
} from './blog-taxonomy.admin.controller';
import { BlogService } from './blog.service';
import { BlogTaxonomyService } from './blog-taxonomy.service';

@Module({
  imports: [AuthModule],
  controllers: [
    BlogController,
    BlogAdminController,
    BlogCategoriesAdminController,
    BlogTagsAdminController,
  ],
  providers: [BlogService, BlogTaxonomyService],
})
export class BlogModule {}
