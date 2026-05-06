import { IsNumber, IsOptional, Min, IsString } from 'class-validator';

export class CreateLineDto {
  @IsString()
  idProduct: string;

  @IsNumber()
  @Min(1)
  qnt: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}
