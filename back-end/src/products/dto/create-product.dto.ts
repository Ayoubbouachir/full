import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  nomP: string;

  @IsNumber()
  @Min(0)
  prix: number;

  @IsNumber()
  @Min(0)
  quantite: number;

  @IsString()
  @IsOptional()
  imagePUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  categorie: string;

  @IsString()
  @IsNotEmpty()
  supplierId: string;
}
