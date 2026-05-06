import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class ClusterProjectsDto {
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(10)
  k?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(15)
  maxK?: number;
}
