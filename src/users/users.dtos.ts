import { IsNotEmpty } from "class-validator";

export class ActivateUserDTO {
    @IsNotEmpty()
    nick: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    sessionId: string;
}

export class ChangeDiscordDTO {
    @IsNotEmpty()
    discord: string;
}

export class ChangePasswordDTO {
    @IsNotEmpty()
    nick: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    sessionId: string;
}

export class ContractUserDTO {
    @IsNotEmpty()
    nick: string;

    @IsNotEmpty()
    type: "SELLING" | "CONTRACTING";

    @IsNotEmpty()
    role: string;

    @IsNotEmpty()
    description: string;
}
