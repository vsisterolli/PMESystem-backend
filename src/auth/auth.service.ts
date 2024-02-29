import {
    BadRequestException,
    Injectable,
    UnauthorizedException
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import * as bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { Request } from "express";
import { CreatePermissionDTO, GivePermissionDTO } from "./auth.dtos";
import * as process from "process";
import { HabboService } from "../habbo/habbo.service";

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private habboServices: HabboService
    ) {}

    async getRoles() {
        return this.prisma.roles.findMany({
            select: {
                hierarchyKind: true,
                hierarchyPosition: true,
                name: true
            },
            orderBy: {
                hierarchyPosition: "asc"
            }
        });
    }

    async signIn(nick: string, password: string): Promise<any> {
        const user = await this.usersService.findByName(nick);
        if (!user || user.isAccountActive === false)
            throw new UnauthorizedException([
                'Sua conta ainda está inativa, tente ativar na aba "ATIVAR CONTA"'
            ]);
        if (!user || bcrypt.compareSync(password, user.password) === false) {
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
                },
                userDepartamentRole: {
                    select: {
                        departamentRoles: {
                            select: {
                                name: true,
                                departament: true,
                                powerLevel: true
                            }
                        }
                    }
                }
            }
        });
        userData["access_token"] =
            process.env.LOCAL === "TRUE"
                ? "Bearer " + (await this.jwtService.signAsync(payload))
                : "";

        const cookieToken = await this.jwtService.signAsync(payload);

        return { userData, cookieToken };
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

    async createPermission(request: Request, data: CreatePermissionDTO) {
        if (!request["user"] || request["user"].isAdmin === false)
            throw new UnauthorizedException([
                "Sem permissão para realizar essa ação."
            ]);

        return this.prisma.permissionsRequired.create({
            data
        });
    }

    async givePermission(request: Request, data: GivePermissionDTO) {
        if (!request["user"] || request["user"].isAdmin === false)
            throw new UnauthorizedException([
                "Sem permissão para realizar essa ação."
            ]);

        data.userNick = (
            await this.habboServices.findHabboUser(data.userNick)
        ).name;

        const user = await this.prisma.user.findUnique({
            where: {
                nick: data.userNick
            }
        });

        if (!user) throw new BadRequestException("Usuário não existente");

        return this.prisma.permissionsObtained.create({
            data: {
                userId: user.id,
                name: data.name,
                type: data.type,
                fullName: data.fullName
            }
        });
    }
}
