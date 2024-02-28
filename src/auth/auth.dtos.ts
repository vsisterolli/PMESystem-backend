import { IsNotEmpty } from "class-validator";

export class SignInDTO {
    @IsNotEmpty()
    nick: string;

    @IsNotEmpty()
    password: string;
}

export class CreateRoleDTO {
    @IsNotEmpty()
    hierarchyPosition: number;

    @IsNotEmpty()
    hierarchyKind: "EXECUTIVE" | "MILITARY";

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    promotesUntilRolePosition: number;

    @IsNotEmpty()
    demoteUntilRolePosition: number;

    @IsNotEmpty()
    fireUntilRolePosition: number;

    @IsNotEmpty()
    gratifyUntilRolePosition: number;

    @IsNotEmpty()
    daysToBePromoted: number;
}

export class CreatePermissionDTO {
    @IsNotEmpty()
    action: "BE_PROMOTED" | "PROMOTE" | "DEMOTE" | "FIRE" | "GRATIFY";

    @IsNotEmpty()
    type: "COURSE" | "OTHER";

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    roleName: string;
}

export class GivePermissionDTO {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    fullName: string;

    @IsNotEmpty()
    type: "COURSE" | "OTHER";

    @IsNotEmpty()
    userNick: string;
}
