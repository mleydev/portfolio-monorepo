import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlogTaxonomyService } from './blog-taxonomy.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';
import { CreateBlogTagDto } from './dto/create-blog-tag.dto';
import { UpdateBlogTagDto } from './dto/update-blog-tag.dto';

@ApiTags('Admin Blog Taxonomy')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin/blog/categories')
export class BlogCategoriesAdminController {
  constructor(private readonly taxonomyService: BlogTaxonomyService) {}

  @Get()
  findAll() {
    return this.taxonomyService.findAllCategories();
  }

  @Post()
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.taxonomyService.createCategory(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.taxonomyService.updateCategory(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taxonomyService.removeCategory(id);
  }
}

@ApiTags('Admin Blog Taxonomy')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin/blog/tags')
export class BlogTagsAdminController {
  constructor(private readonly taxonomyService: BlogTaxonomyService) {}

  @Get()
  findAll() {
    return this.taxonomyService.findAllTags();
  }

  @Post()
  create(@Body() dto: CreateBlogTagDto) {
    return this.taxonomyService.createTag(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBlogTagDto) {
    return this.taxonomyService.updateTag(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taxonomyService.removeTag(id);
  }
}
