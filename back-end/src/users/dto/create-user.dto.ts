import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  prenom: string;

  @IsString()
  @IsOptional()
  numTele?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  cin?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  // Worker specific
  @IsString()
  @IsOptional()
  cv?: string;

  @IsString()
  @IsOptional()
  speciality?: string;

  // Supplier specific
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  companyType?: string;

  // Delivery specific
  @IsString()
  @IsOptional()
  carPlate?: string;

  @IsString()
  @IsOptional()
  deplome?: string;

  // Artisan specific
  @IsString()
  @IsOptional()
  position?: string;

  // Face recognition
  @IsOptional()
  faceDescriptor?: number[];
}
