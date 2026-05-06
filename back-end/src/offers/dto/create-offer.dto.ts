import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  requestId: string;

  @IsNumber()
  proposedPrice: number;

  @IsOptional()
  @IsString()
  message?: string;
}
