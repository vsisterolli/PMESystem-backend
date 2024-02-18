import {
    Body,
    Controller,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards
} from "@nestjs/common";
import { PromoteDTO } from "./actions.dtos";
import { AuthGuard } from "../auth/auth.guard";
import { ActionsService } from "./actions.service";
import { Request, Response } from "express";

@Controller("actions")
export class ActionsController {
    constructor(private actionsService: ActionsService) {}

    @UseGuards(AuthGuard)
    @Post("/promote")
    async promoteUser(
        @Body() promoteUserDTO: PromoteDTO,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            await this.actionsService.promoteUser(
                promoteUserDTO.promotedNick,
                req
            );
            res.send();
        } catch (e) {
            res.status(HttpStatus.BAD_REQUEST).send([e.message]);
        }
    }
}
