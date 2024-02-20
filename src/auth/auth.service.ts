import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import * as bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { Request } from "express";

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService
    ) {}

    async signIn(nick: string, password: string): Promise<any> {
        const user = await this.usersService.findByName(nick);
        if(!user || user.isAccountActive === false)
            throw new UnauthorizedException(['Sua conta ainda está inativa, tente ativar na aba "ATIVAR CONTA"'])
        if (
            !user ||
            bcrypt.compareSync(password, user.password) === false
        ) {
            throw new UnauthorizedException([
                "Combinação de usuário/senha inexistente."
            ]);
        }

        const payload = { nick };
        const userData = await this.prisma.user.findUnique({
            where: {
                nick
            },
            select: {
                nick: true,
                role: {
                    select: {
                        name: true
                    }
                },
                permissionsObtained: {
                    select: {
                        name: true,
                        type: true
                    }
                }
            }
        })

        return {
            access_token: "Bearer " + (await this.jwtService.signAsync(payload)),
            userData
        };
    }

    async createAuthSession() {
        // generates a 5 digits code from 00000 to 99999
        const codeBase = Math.floor(Math.random() * 99999);
        const code = codeBase.toString().padStart(5, "0");

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        return this.prisma.session.create({
            data: {
                code,
                expiresAt
            }
        });
    }

    async createRole(request: Request, data: Prisma.RolesCreateInput) {
        if (!request["user"] || request["user"].isAdmin === false)
            throw new UnauthorizedException([
                "Sem permissão para realizar essa ação."
            ]);

        return this.prisma.roles.create({
            data
        });
    }

    async createPermission(
        request: Request,
        data: Prisma.PermissionsRequiredCreateInput
    ) {
        if (!request["user"] || request["user"].isAdmin === false)
            throw new UnauthorizedException([
                "Sem permissão para realizar essa ação."
            ]);

        return this.prisma.permissionsRequired.create({
            data
        });
    }

    async givePermission(
        request: Request,
        data: Prisma.PermissionsObtainedCreateInput
    ) {
        if (!request["user"] || request["user"].isAdmin === false)
            throw new UnauthorizedException([
                "Sem permissão para realizar essa ação."
            ]);

        return this.prisma.permissionsObtained.create({
            data
        });
    }
}
