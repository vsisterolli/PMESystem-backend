import { IsNotEmpty } from "class-validator";
import {Departament} from "@prisma/client";

export class PostClassDTO {
    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    courseAcronym: string;

    @IsNotEmpty()
    approved: string[];

    @IsNotEmpty()
    failed: string[];

    @IsNotEmpty()
    room: string;
}

export class PostRoleDTO {
    @IsNotEmpty()
    roleName;

    @IsNotEmpty()
    userNick;
}


export class DeleteUserDTO {
  @IsNotEmpty()
  departament: string;

  @IsNotEmpty()
  userNick: string;
}