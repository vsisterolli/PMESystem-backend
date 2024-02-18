import { Body, Controller, HttpStatus, Patch, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { ActivateUserDTO, CreateUserDTO } from "./users.dtos";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
    constructor(private usersServices: UsersService) {}

    @Post()
    async createUser(
        @Body() createUserDTO: CreateUserDTO,
        @Res() res: Response
    ) {
        try {
            await this.usersServices.createUser(createUserDTO);
            return res.status(HttpStatus.CREATED).send();
        } catch (e) {
            if (e.message === "Invalid password") {
                return res.status(HttpStatus.BAD_REQUEST).send(e.errors);
            }

            if (e.message === "Usuário já criado.") {
                return res.status(HttpStatus.CONFLICT).send([e.message]);
            }

            if (e.message === "Usuário não existente no habbo.") {
                return res.status(HttpStatus.BAD_REQUEST).send(e.message);
            }

            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
        }
    }

    @Patch("activate")
    async activateUser(
        @Body() activateUserDTO: ActivateUserDTO,
        @Res() res: Response
    ) {
        try {
            await this.usersServices.activateUser(activateUserDTO);
            return res.status(HttpStatus.OK).send();
        } catch (e) {
            if (e.message === "Senha inválida")
                return res.status(HttpStatus.BAD_REQUEST).send(e.errors);
            return res.status(HttpStatus.BAD_REQUEST).send([e.message]);
        }
    }
}
