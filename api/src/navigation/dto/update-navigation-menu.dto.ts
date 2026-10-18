import { PartialType } from '@nestjs/mapped-types';
import { CreateNavigationMenuDto } from './create-navigation-menu.dto';

export class UpdateNavigationMenuDto extends PartialType(
  CreateNavigationMenuDto,
) {}
