import { ArrayMinSize, IsArray, IsString, MaxLength } from 'class-validator';

export class VotePollDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  optionIds: string[];

  @IsString()
  @MaxLength(128)
  voterKey: string;
}
