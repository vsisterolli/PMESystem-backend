import { IsNotEmpty } from 'class-validator';

export class SignInDTO {
  @IsNotEmpty()
  nick: string;

  @IsNotEmpty()
  password: string;
}