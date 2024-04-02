import {
    Body,
    Controller, Get,
    HttpStatus,
    Post, Query,
    Req,
    Res,
    UseGuards
} from "@nestjs/common";
import {
    BonifyDTO,
    DemoteDTO,
    DemoteMultipleDTO,
    FireDTO,
    FireMultipleDTO,
    PromoteDTO,
    WarnDTO,
    WarnMultipleDTO
} from './actions.dtos';
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
    @Get("/mostBonificationsWeekly")
    async getMostBonifiedUsers() {
        return await this.actionsService.getMostBonifiedInWeek();
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
    @Post("/demote/multiple")
    async demoteMultiple(
      @Body() demoteMultipleDTO: DemoteMultipleDTO,
      @Req() req: Request,
      @Res() res: Response
    ) {
        try {
            await this.actionsService.demoteMultiple(
              req,
              demoteMultipleDTO.demotedNicks,
              demoteMultipleDTO.description,
            );
            res.send();
        } catch (e) {
            res.status(HttpStatus.BAD_REQUEST).send([e.message]);
        }
    }

    @UseGuards(AuthGuard)
    @Post("/fire/multiple")
    async fireMultiple(
      @Body() fireMultipleDTO: FireMultipleDTO,
      @Req() req: Request,
      @Res() res: Response
    ) {
        try {
            await this.actionsService.fireMultiple(
              req,
              fireMultipleDTO.firedNicks,
              fireMultipleDTO.description,
            );
            res.send();
        } catch (e) {
            res.status(HttpStatus.BAD_REQUEST).send([e.message]);
        }
    }

    @UseGuards(AuthGuard)
    @Post("/warn/multiple")
    async warnMultiple(
      @Body() warnMultipleDTO: WarnMultipleDTO,
      @Req() req: Request,
      @Res() res: Response
    ) {
        try {
            await this.actionsService.warnMultiple(
              req,
              warnMultipleDTO.warnedNicks,
              warnMultipleDTO.description,
            );
            res.send();
        } catch (e) {
            res.status(HttpStatus.BAD_REQUEST).send([e.message]);
        }
    }


    @UseGuards(AuthGuard)
    @Post("/bonify")
    async bonifyUser(
        @Body() bonifyUserDTO: BonifyDTO,
        @Req() request: Request
    ) {
        return await this.actionsService.bonifyUser(request, bonifyUserDTO.user, bonifyUserDTO.reason);
    }

    @UseGuards(AuthGuard)
    @Get("/bonifications")
    async getBonifications (
      @Req() req: Request, @Query() query
    ) {
        return await this.actionsService.getBonifications(req, query);
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
