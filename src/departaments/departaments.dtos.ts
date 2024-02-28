import {IsNotEmpty} from "class-validator";

export class PostClassDTO {
  @IsNotEmpty()
  description: string

  @IsNotEmpty()
  courseAcronym: string

  @IsNotEmpty()
  approved: string[]

  @IsNotEmpty()
  failed: string[]

  @IsNotEmpty()
  room: string
}