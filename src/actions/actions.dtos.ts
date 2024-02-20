import { IsNotEmpty } from "class-validator";

export class PromoteDTO {
    @IsNotEmpty()
    promotedNick: string;

    @IsNotEmpty()
    description: string;
}
