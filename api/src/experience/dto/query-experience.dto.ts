import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryExperienceDto {
  @IsOptional()
  @IsIn(['fa', 'en', 'tr', 'ar'])
  lang: 'fa' | 'en' | 'tr' | 'ar' = 'fa';

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}
