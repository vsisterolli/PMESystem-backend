import {
    BadRequestException,
    Injectable, NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from "../prisma.service";
import { Prisma, Session, User } from "@prisma/client";
import {
    ActivateUserDTO,
    ChangeDiscordDTO,
    ChangePasswordDTO,
    ContractUserDTO
} from "./users.dtos";
import * as bcrypt from "bcrypt";
import { HabboService } from "../habbo/habbo.service";
import { Request } from "express";
import * as process from "process";

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private habboServices: HabboService
    ) {}

    async getProfileToDC(request, nick) {
        if(request.headers.authorization !== process.env.DISCORD_TOKEN)
            throw new UnauthorizedException("Unauthorized")

        nick = decodeURIComponent(nick);
        console.log(nick)

        const user = await this.prisma.user.findUnique({
            where: {
                nick
            },
            select: {
                roleName: true,
                role: true,
                userDepartamentRole: true,
            }
        })
        return user;


    }

    async changeUserNick(request, prevNick, newNick) {
        if(request["user"].role.hierarchyPosition <= 10 || request["user"].role.hierarchyKind === "EXECUTIVE")
            throw new UnauthorizedException("Sem permissão para trocar nick")

        try {
            prevNick = (await this.habboServices.findHabboUser(prevNick)).name;
            newNick = (await this.habboServices.findHabboUser(newNick)).name;
        } catch {
            newNick = "";
        }
        if(newNick === "")
            throw new BadRequestException("Usuário não existe no habbo, verifique se escreveu o nick corretamente.")

        // @ts-ignore
        const user = await this.prisma.user.findUnique({
            where: { nick: prevNick },
            select: { role: true, id: true }
        }) as User;

        if(!user)
            throw new NotFoundException("Usuário não encontrado no PME System.")

        // @ts-ignore
        if(user.role.hierarchyPosition >= request["user"].role.hierarchyPosition)
            throw new BadRequestException("Você não pode mudar o nick desse usuário.")


        const isExistentUser = await this.prisma.user.findUnique({
          where: {nick: newNick}
        }) as User;

        if(isExistentUser && isExistentUser.roleName !== "Recruta")
            throw new BadRequestException("O nick novo está cadastrado como um usuário ativo no PME System");

        if(isExistentUser) {
            await this.prisma.activityLog.updateMany({
                where: {
                    targetId: isExistentUser.id
                },
                data: {
                    targetId: user.id
                }
            })
            await this.prisma.user.delete({
                where: { id: isExistentUser.id }
            })
        }

        console.log(user)
        await this.prisma.user.update({
            where: {
                nick: prevNick
            },
            data: {
                nick: newNick
            }
        })

        await this.prisma.activityLog.create({
                data: {
                    type: "CHANGE",
                    targetId: user.id,
                    author: request["user"].nick,
                    description: `Troca de conta || Nick antigo: ${prevNick}\n  || Novo nick: ${newNick}`
                }
        })


    }

    async getUsersByRole(role) {
        if(role === "Recruta")
            return [];

        return this.prisma.user.findMany({
            where: {
                roleName: role
            },
            select: {
                nick: true
            }
        })
    }

    async getSelfInfo(req: Request) {
        const user = await this.prisma.user.findUnique({
            where: {
                nick: req["user"].nick
            },
            select: {
                nick: true,
                role: {
                    select: {
                        name: true,
                        hierarchyPosition: true
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
        })

        if(!user)
            throw new UnauthorizedException("Precisa estar logado para acessar essa informação.")
        return user;
    }

    async changeDiscord(changeDiscordDTO: ChangeDiscordDTO, req: Request) {
        await this.prisma.user.update({
            where: {
                nick: req["user"].nick
            },
            data: {
                discord: changeDiscordDTO.discord
            }
        });
    }

    async getPermissions(request: Request) {
        return this.prisma.permissionsObtained.findMany({
            where: {
                userId: request["user"].id
            }
        });
    }
    async getRecentUsers() {
        // @ts-ignore
        return this.prisma.user.findMany({
            select: {
                nick: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 5
        });
    }

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
        if (isAnExistentUser.roleName === "Recruta")
            return "Você precisa se alistar antes de ativar a conta";

        if (isAnExistentUser.isAccountActive) return "Usuário já ativo.";

        return "";
    }

    async validateActiveUser(nick: string): Promise<string> {
        const isAnExistentUser = (await this.prisma.user.findUnique({
            where: {
                nick
            }
        })) as User;

        if (isAnExistentUser === null)
            return "Usuário inexistente. Você provavelmente ainda não se alistou, procure nossa base no Habbo Hotel!";
        if (isAnExistentUser.roleName === "Recruta")
            return "Você precisa se alistar antes de ativar a conta";

        if (!isAnExistentUser.isAccountActive)
            return "Usuário inativo. Ative sua conta primeiro";

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

    async getUserProfile(nick) {
        nick = decodeURIComponent(nick);
        let newNick = "";
        try {
            newNick = (await this.habboServices.findHabboUser(nick)).name;
        } catch {
            newNick = "";
        }

        const user = await this.prisma.user.findUnique({
            where: {
                nick: newNick !== "" ? newNick : nick
            },
            select: {
                nick: true,
                roleName: true,
                isAccountActive: true,
                lastPromoted: true,
                createdAt: true,
                discord: true,
                advNum: true,
                capeSelected: true,
                bonificationsInRole: true,
                totalBonifications: true,
                permissionsObtained: {
                    select: {
                        name: true,
                        fullName: true,
                        type: true
                    }
                },
                ActivityLog: {
                    orderBy: {
                        createdAt: "desc"
                    }
                },
                userDepartamentRole: {
                    select: {
                        departamentRoles: true
                    }
                }
            }
        });
        if (!user) {
            // @ts-ignore
            const similarNicks = await this.prisma.user.findMany({
                where: {
                    nick: {
                        contains: newNick !== "" ? newNick : nick,
                        mode: "insensitive"
                    }
                },
                select: {
                    nick: true,
                    isAccountActive: true
                },
                orderBy: {
                    isAccountActive: "desc"
                },
                take: 10
            });
            return similarNicks;
        }
        return user;
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

    async changeUserPassword(data: ChangePasswordDTO) {
        const validationError = await this.validateActiveUser(data.nick);
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

        if (
            habboUser.motto.includes(`PMETROCAR${confirmSession.code}`) ===
            false
        )
            throw new BadRequestException(
                "Missão incorreta! Lembre-se de trocar sua missão para PMETROCAR" +
                    confirmSession.code
            );

        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(data.password, salt);

        await this.prisma.user.update({
            where: {
                nick: data.nick
            },
            data: {
                password: hash
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

    async contractUser(data: ContractUserDTO, req: Request) {
        if (
            !req["user"] ||
            (req["user"].roleName !== "Conselheiro" &&
                req["user"].roleName !== "Supremo")
        )
            throw new UnauthorizedException(
                "Você não tem permissão para contratar."
            );

        if (
            (data.role === "Supremo" || data.role === "Conselheiro") &&
            !req["user"].isAdmin
        )
            throw new UnauthorizedException(
                "Apenas administradores do site podem contratar um supremo ou conselheiro"
            );

        data.nick = (await this.habboServices.findHabboUser(data.nick)).name;
        let user = (await this.prisma.user.findUnique({
            where: {
                nick: data.nick
            }
        })) as User;


        if (user) {
            await this.prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    roleName: data.role,
                    bonificationsInRole: 0
                }
            });
        } else {
            user = await this.prisma.user.create({
                data: {
                    nick: data.nick,
                    roleName: data.role
                }
            });
        }

        await this.prisma.activityLog.create({
            data: {
                author: req["user"].nick,
                targetId: user.id,
                type: data.type,
                description: data.description,
                newRole: data.role
            }
        });
    }
}
