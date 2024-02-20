import { IsNotEmpty } from "class-validator";

export class CreateUserDTO {
    @IsNotEmpty()
    nick: string;
}

export class ActivateUserDTO {
    @IsNotEmpty()
    nick: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    sessionId: string;
}
