import { IsNotEmpty } from "class-validator";

export class PromoteDTO {
    @IsNotEmpty()
    promotedNick: string;

    @IsNotEmpty()
    description: string;
}

export class DemoteDTO {
    @IsNotEmpty()
    demotedNick: string;

    @IsNotEmpty()
    description: string;
}

export class DemoteMultipleDTO {
    @IsNotEmpty()
    demotedNicks: string[];

    @IsNotEmpty()
    description: string;
}

export class BonifyDTO {
    @IsNotEmpty()
    user: string;

    @IsNotEmpty()
    reason: string;
}
export class FireDTO {
    @IsNotEmpty()
    firedNick: string;

    @IsNotEmpty()
    description: string;
}

export class WarnDTO {
    @IsNotEmpty()
    warnedNick: string;

    @IsNotEmpty()
    description: string;
}
