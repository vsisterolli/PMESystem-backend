import { IsNotEmpty } from 'class-validator';

export class CreateCapeDTO {
  @IsNotEmpty()
  capeName: string;
}

export class AtributeCapeDTO {
  @IsNotEmpty()
  userNick: string;

  @IsNotEmpty()
  capeName: string;
}

export class ChangeCapeDTO {
  @IsNotEmpty()
  capeName: string;
}