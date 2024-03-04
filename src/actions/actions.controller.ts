import {
    Body,
    Controller, Get,
    HttpStatus,
    Post, Query,
    Req,
    Res,
    UseGuards
} from "@nestjs/common";
import { DemoteDTO, FireDTO, PromoteDTO, WarnDTO } from "./actions.dtos";
import { AuthGuard } from "../auth/auth.guard";
import { ActionsService } from "./actions.service";
import { Request, Response } from "express";

@Controller("actions")
export class ActionsController {
    constructor(private actionsService: ActionsService) {}

    @UseGuards(AuthGuard)
    @Get("/")
    async getActions(@Req() req: Request, @Query() query) {
        return this.actionsService.getActions(req, query);
    }

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
                promoteUserDTO.description,
                req
            );
            res.send();
        } catch (e) {
            res.status(HttpStatus.BAD_REQUEST).send([e.message]);
        }
    }

    @UseGuards(AuthGuard)
    @Post("/demote")
    async demoteUser(
        @Body() demoteUserDTO: DemoteDTO,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            await this.actionsService.demoteUser(
                demoteUserDTO.demotedNick,
                demoteUserDTO.description,
                req
            );
            res.send();
        } catch (e) {
            res.status(HttpStatus.BAD_REQUEST).send([e.message]);
        }
    }

    @UseGuards(AuthGuard)
    @Post("/fire")
    async fireUser(
        @Body() demoteUserDTO: FireDTO,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            await this.actionsService.fireUser(
                demoteUserDTO.firedNick,
                demoteUserDTO.description,
                req
            );
            res.send();
        } catch (e) {
            res.status(HttpStatus.BAD_REQUEST).send([e.message]);
        }
    }

    @UseGuards(AuthGuard)
    @Post("/warn")
    async warnUser(
        @Body() warnUserDTO: WarnDTO,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            await this.actionsService.warnUser(
                warnUserDTO.warnedNick,
                warnUserDTO.description,
                req
            );
            res.send();
        } catch (e) {
            res.status(HttpStatus.BAD_REQUEST).send([e.message]);
        }
    }
}
