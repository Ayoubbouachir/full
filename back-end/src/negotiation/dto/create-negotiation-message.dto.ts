import { IsString } from 'class-validator';

export class CreateNegotiationMessageDto {
  @IsString()
  requestId: string;

  @IsString()
  content: string;
}
