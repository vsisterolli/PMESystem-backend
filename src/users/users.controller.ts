import {
    Body,
    Controller, FileTypeValidator,
    Get,
    HttpStatus, MaxFileSizeValidator,
    Param, ParseFilePipe,
    Patch,
    Post,
    Req,
    Res, UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ActivateUserDTO, ContractUserDTO, CreateUserDTO } from './users.dtos';
import { UsersService } from "./users.service";
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller("users")
export class UsersController {
    constructor(private usersServices: UsersService) {}

    @UseGuards(AuthGuard)
    @Get('/recent')
    async recentUsers() {
        return this.usersServices.getRecentUsers();
    }

    @UseGuards(AuthGuard)
    @Get('/profile/:nick')
    async userProfile(@Param('nick') nick, @Res() res: Response) {
        const user = await this.usersServices.getUserProfile(nick);

        // checking if it is not found without throwing because for some reason this shit try catch wasn't getting it
        // @ts-ignore
        if(user.length === 0 || user.length > 0)
            return res.status(404).send(user)

        res.send(user);
    }

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
                return res.status(HttpStatus.CONFLICT).send(e.message);
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

    @UseGuards(AuthGuard)
    @Post("contract")
    async contractUser(
        @Body() contractUserDTO: ContractUserDTO,
        @Req() req: Request
    ) {
        await this.usersServices.contractUser(contractUserDTO, req)
    }
}
