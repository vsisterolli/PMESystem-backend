import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Prisma, Session, User } from "@prisma/client";
import { ActivateUserDTO } from "./users.dtos";
import * as bcrypt from "bcrypt";
import { HabboService } from "../habbo/habbo.service";

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private habboServices: HabboService
    ) {}

    validatePassword(password: string): string[] {
        const errors: string[] = [];
        if (password.length <= 7)
            errors.push("A senha precisa ter pelo menos 8 caracteres.");

        const differentChars = {
            number: "A senha precisa ter pelo menos 1 número.",
            lowerCase: "A senha precisa ter pelo menos 1 letra minúscula",
            upperCase: "A senha precisa ter pelo menos 1 letra maiúscula",
            specialChar: "A senha precisa ter 1 caractere especial"
        };

        const specialCharRegex = new RegExp("[^A-Za-z0-9]");

        for (const char of password) {
            if (char >= "A" && char <= "Z") differentChars["upperCase"] = "";
            if (char >= "a" && char <= "z") differentChars["lowerCase"] = "";
            if (char >= "0" && char <= "9") differentChars["number"] = "";
            if (specialCharRegex.test(char)) differentChars["specialChar"] = "";
        }

        for (const value of Object.values(differentChars))
            if (value !== "") errors.push(value);

        return errors;
    }

    async validateInactiveUser(nick: string): Promise<string> {
        const isAnExistentUser = (await this.prisma.user.findUnique({
            where: {
                nick
            }
        })) as User;

        if (isAnExistentUser === null)
            return "Usuário inexistente. Você provavelmente ainda não se alistou, procure nossa base no Habbo Hotel!";

        if (isAnExistentUser.isAccountActive) return "Usuário já ativo.";

        return "";
    }

    async validateSession(sessionId: string): Promise<{
        confirmSession: Session;
        error: string;
    }> {
        const confirmSession = (await this.prisma.session.findUnique({
            where: {
                id: sessionId
            }
        })) as Session;

        let error = "";
        if (!confirmSession) error = "Sessão inválida";
        if (confirmSession.expiresAt < new Date())
            error = "Sessão expirada! Um novo código de missão foi gerado.";

        return {
            confirmSession,
            error
        };
    }

    async getUsers(params: {
        skip?: number;
        take?: number;
        where?: Prisma.UserWhereInput;
    }): Promise<User[]> {
        const { skip, take, where } = params;
        return this.prisma.user.findMany({
            skip,
            take,
            where
        });
    }
    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        const isAnExistentUser = (await this.prisma.user.findUnique({
            where: {
                nick: data.nick
            }
        })) as User;

        if (isAnExistentUser)
            throw new BadRequestException(["Usuário já criado."]);

        await this.habboServices.findHabboUser(data.nick);
        try {
            await this.prisma.user.create({
                data
            });
        } catch (e) {
            console.log(e);
        }

        return;
    }

    async activateUser(data: ActivateUserDTO) {
        const validationError = await this.validateInactiveUser(data.nick);
        if (validationError !== "")
            throw new BadRequestException(validationError);

        const validationErrors = this.validatePassword(data.password);
        if (validationErrors.length) {
            const invalidPasswordError = new Error("Senha inválida");
            invalidPasswordError["errors"] = validationErrors;
            throw invalidPasswordError;
        }

        const { confirmSession, error } = await this.validateSession(
            data.sessionId
        );
        if (error) throw new BadRequestException(error);

        const habboUser = await this.habboServices.findHabboUser(data.nick);

        if (habboUser.motto.includes(`PME${confirmSession.code}`) === false)
            throw new BadRequestException(
                "Missão incorreta! Lembre-se de trocar sua missão para PME" +
                    confirmSession.code
            );

        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(data.password, salt);

        await this.prisma.user.update({
            where: {
                nick: data.nick
            },
            data: {
                password: hash,
                isAccountActive: true
            }
        });
    }

    async findByName(nick: string): Promise<User> {
        return this.prisma.user.findUnique({
            where: {
                nick
            }
        });
    }
}
