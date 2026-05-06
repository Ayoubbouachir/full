import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsArray,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsDateString()
  dateD: string;

  @IsDateString()
  dateF: string;

  @IsNumber()
  @Min(0)
  cout: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  nbArtisan?: number;

  @IsArray()
  @IsOptional()
  maquettes?: string[];

  @IsArray()
  @IsOptional()
  artisanIds?: string[];

  @IsArray()
  @IsOptional()
  engineerIds?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  nbEngineer?: number;

  @IsString()
  @IsOptional()
  idUserEng?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  surface?: number;
}
