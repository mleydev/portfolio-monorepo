import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { QueryBlogArticlesDto } from './dto/query-blog-articles.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  findAll(@Query() query: QueryBlogArticlesDto) {
    return this.blogService.findAllPublic(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @Query() query: QueryBlogArticlesDto) {
    return this.blogService.findPublicBySlug(slug, query.lang);
  }
}
