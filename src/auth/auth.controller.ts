import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards
} from "@nestjs/common";
import {
    CreatePermissionDTO,
    CreateRoleDTO,
    GivePermissionDTO,
    SignInDTO
} from "./auth.dtos";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";
import { Request, Response } from "express";
import * as process from 'process';

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("login")
    async signIn(@Body() signInDto: SignInDTO, @Res() res: Response) {
        const data = await this.authService.signIn(
            signInDto.nick,
            signInDto.password
        );
        res.cookie("token", data.access_token, {
            maxAge: 7 * 24 * 60 * 60,
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        });
        if(process.env.LOCAL === "TRUE")
            return res.send(data)

        return res.send(data.userData);
    }

    @HttpCode(HttpStatus.CREATED)
    @Post("session")
    createSession() {
        return this.authService.createAuthSession();
    }

    @UseGuards(AuthGuard)
    @Post("role")
    async createRole(
        @Req() req: Request,
        @Body() createRoleDTO: CreateRoleDTO,
        @Res() res: Response
    ) {
        try {
            await this.authService.createRole(req, createRoleDTO);
            res.send();
        } catch (e) {
            console.log(e)
            res.status(HttpStatus.UNAUTHORIZED).send([
                "Não autorizado ou cargo já existente."
            ]);
        }
    }

    @UseGuards(AuthGuard)
    @Post("create/permission")
    async createPermission(
        @Req() req: Request,
        @Body() createPermissionDTO: CreatePermissionDTO,
        @Res() res: Response
    ) {
        try {
            await this.authService.createPermission(req, createPermissionDTO);
            res.send();
        } catch (e) {
            res.status(HttpStatus.UNAUTHORIZED).send(["Não autorizado."]);
        }
    }

    @UseGuards(AuthGuard)
    @Post("give/permission")
    async givePermission(
        @Req() req: Request,
        @Body() givePermissionDTO: GivePermissionDTO,
        @Res() res: Response
    ) {
        try {
            await this.authService.givePermission(req, givePermissionDTO);
            res.send();
        } catch (e) {
            console.log(e)
            res.status(HttpStatus.UNAUTHORIZED).send(["Não autorizado."]);
        }
    }
}
