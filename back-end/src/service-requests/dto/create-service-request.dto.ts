import { IsString, IsOptional } from 'class-validator';

export class CreateServiceRequestDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  requiredProfession: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  budgetRange?: string;
}
