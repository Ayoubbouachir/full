import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';

import { Type } from 'class-transformer';
import { CreateLineDto } from './create-line.dto';

export class CreateOrderDto {
  @IsDateString()
  @IsOptional()
  dateArrivage?: string;

  @IsDateString()
  @IsOptional()
  dateLivraison?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional() // Optional for now to avoid breaking existing flow, but we will pass it
  userEmail?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineDto)
  lines: CreateLineDto[];
}
