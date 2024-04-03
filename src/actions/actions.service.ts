import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from "../prisma.service";
import { Request } from "express";
import * as moment from "moment";
import {
    PermissionsObtained,
    PermissionsRequired,
    Prisma,
    Roles, User,
} from '@prisma/client';
import { HabboService } from '../habbo/habbo.service';
import { uuid } from 'uuidv4';

type UserWithRole = Prisma.UserGetPayload<{
    include: { role: true };
}>;

@Injectable()
export class ActionsService {
    constructor(private prismaService: PrismaService, private habboService: HabboService) {}



    async getMostBonifiedInWeek() {
        return this.prismaService.$queryRaw(Prisma.sql`
            SELECT u.nick, CAST(SUM(b.gains) AS numeric) AS totalGains 
            FROM "Bonification" b
            JOIN "User" u
            ON u.id = b."targetId"
            WHERE b."createdAt" >= ${moment().startOf("week").add(3, "hours").toDate()}
            GROUP BY u.nick
            ORDER BY totalGains DESC
            LIMIT 5;   
        `);
    }

    async getBonifications(
      request: Request,
      query: {
          offset: string | null;
          search: string | null;
          mode: "mine" | "all";
      }
    ){
        const sql = {
            where: {},
            select: {
                id: true,
                author: true,
                user: {
                    select: {
                        nick: true
                    }
                },
                gains: true,
                reason: true,
                createdAt: true,
            },
            take: 10,
            orderBy: [{ createdAt: "desc" }]
        };

        if (query.mode === "mine") sql.where["author"] = request["user"].nick;
        if (query.offset) sql["skip"] = Number(query.offset);

        const isNum = (str) => {
            return !isNaN(str) && !isNaN(parseFloat(str));
        };

        let dateToSearch = {
            begin: moment().endOf("day"),
            end: moment().startOf("day")
        }

        if(moment(query.search, "DD/MM/YYYY").isValid())
            dateToSearch = {
                begin: moment(query.search, "DD/MM/YYYY").startOf("day").add(3, "hours"),
                end: moment(query.search, "DD/MM/YYYY").endOf("day").add(3, "hours")
            }

        if (query.search && query.search !== "")
            sql.where["OR"] = [
                { author: { contains: query.search } },
                { reason: { contains: query.search } },
                {
                    createdAt: {
                        gte: dateToSearch.begin,
                        lte: dateToSearch.end
                    }
                },
                {
                    id: {
                        equals: isNum(query.search) ? Number(query.search) : -1
                    }
                },
                {
                    user: {nick: {contains: query.search}}
                }
            ];

        // @ts-ignore
        return this.prismaService.$transaction([
            // @ts-ignore
            this.prismaService.bonification.count({ where: sql.where }),
            // @ts-ignore
            this.prismaService.bonification.findMany(sql)
        ]);
    }

    async getActions(
      request: Request,
      query: {
          action: string;
          offset: string | null;
          search: string | null;
          mode: "mine" | "all";
      }
    ) {
        let userRole;

        if (
          request["user"].roleName === "Supremo" ||
          request["user"].roleName === "Conselheiro"
        )
            userRole = {
                powerLevel: 1000
            };
        else
            request["user"].userDepartamentRole.forEach((role) => {
                if (role.departamentRoles.departament === "RH")
                    userRole = role.departamentRoles;
            });

        if (query.mode === "all" && !userRole)
            throw new UnauthorizedException(
              "Você só pode ver suas próprias postagens."
            );

        let dateToSearch = {
            begin: moment().endOf("day"),
            end: moment().startOf("day")
        }

        if(moment(query.search, "DD/MM/YYYY").isValid())
            dateToSearch = {
                begin: moment(query.search, "DD/MM/YYYY").startOf("day").add(3, "hours"),
                end: moment(query.search, "DD/MM/YYYY").endOf("day").add(3, "hours")
            }

        const sql = {
            where: {
                type: query.action
            },
            select: {
                id: true,
                author: true,
                user: {
                    select: {
                        nick: true
                    }
                },
                description: true,
                createdAt: true,
                newRole: true
            },
            take: 10,
            orderBy: [{ createdAt: "desc" }]
        };

        if (query.mode === "mine") sql.where["author"] = request["user"].nick;
        if (query.offset) sql["skip"] = Number(query.offset);

        const isNum = (str) => {
            return !isNaN(str) && !isNaN(parseFloat(str));
        };

        if (query.search && query.search !== "")
            sql.where["OR"] = [
                { author: { contains: query.search } },
                { description: { contains: query.search } },
                {
                    createdAt: {
                        gte: dateToSearch.begin,
                        lte: dateToSearch.end
                    }
                },
                {
                    id: {
                        equals: isNum(query.search) ? Number(query.search) : -1
                    }
                },
                {
                    user: {nick: {contains: query.search}}
                }
            ];

        // @ts-ignore
        return this.prismaService.$transaction([
            // @ts-ignore
            this.prismaService.activityLog.count({ where: sql.where }),
            // @ts-ignore
            this.prismaService.activityLog.findMany(sql)
        ]);
    }

    missingPermissions(
        needed: PermissionsRequired[],
        obtained: PermissionsObtained[]
    ): boolean {
        const permissionExists: Map<string, boolean> = new Map();
        obtained.forEach((permission) =>
            permissionExists.set(permission.name, true)
        );
        for (const permission of needed) {
            if (permissionExists.has(permission.name) === false) return true;
        }
        return false;
    }

    async promoteUser(nick: string, description: string, request: Request) {
        nick = (await this.habboService.findHabboUser(nick)).name;

        const promotedUserPromise = this.prismaService.user.findUnique({
            where: {
                nick
            },
            include: {
                role: true
            }
        });

        const promoterPromise = this.prismaService.user.findUnique({
            where: {
                nick: request["user"].nick
            },
            include: {
                role: true
            }
        });

        // @ts-expect-error
        const [promotedUser, promoter]: {
            promotedUser: UserWithRole;
            promoter: UserWithRole;
        } = await Promise.all([promotedUserPromise, promoterPromise]);

        if (
            !promotedUser ||
            promotedUser.role.name === "Recruta" ||
            promotedUser.role.hierarchyPosition >
                promoter.role.promotesUntilRolePosition
        ) {
            throw new UnauthorizedException(
                "Você não pode promover esse usuário."
            );
        }

        if(!promotedUser.isAccountActive) {
            throw new BadRequestException("Ajude-o a ativar a conta no system antes de promovê-lo.")
        }

        const daysInRole = moment().diff(
            moment(promotedUser.lastPromoted),
            "days"
        );
        if (daysInRole < promotedUser.role.daysToBePromoted) {
            throw new ForbiddenException(
                "Esse usuário ainda não atingiu o tempo mínimo para ser promovido."
            );
        }

        const promotedRequiredCoursesPromise =
            this.prismaService.permissionsRequired.findMany({
                where: {
                    action: "BE_PROMOTED",
                    OR: [
                        {roleName: promotedUser.roleName},
                        {hierarchyKind: promotedUser.role.hierarchyKind}
                    ]                }
            });

        const promoterRequiredCoursesPromise =
            this.prismaService.permissionsRequired.findMany({
                where: {
                    action: "PROMOTE",
                    OR: [
                        {roleName: promoter.roleName},
                        {hierarchyKind: promoter.role.hierarchyKind}
                    ]
                }
            });

        const promotedObtainedPermissionsPromise =
            this.prismaService.permissionsObtained.findMany({
                where: {
                    userId: promotedUser.id
                }
            });

        const promoterObtainedPermissionsPromise =
            this.prismaService.permissionsObtained.findMany({
                where: {
                    userId: promoter.id
                }
            });

        const [
            promotedRequiredCourses,
            promoterRequiredCourses,
            promotedObtainedPermissions,
            promoterObtainedPermissions
        ] = await Promise.all([
            promotedRequiredCoursesPromise,
            promoterRequiredCoursesPromise,
            promotedObtainedPermissionsPromise,
            promoterObtainedPermissionsPromise
        ]);

        let hasCapex = false;
        promoterObtainedPermissions.forEach(permission => {
            if(permission.name === "CApEx")
                hasCapex = true;
        })

        // @ts-ignore
        if (
            this.missingPermissions(
                promotedRequiredCourses,
                promotedObtainedPermissions
            )
        ) {
            throw new ForbiddenException(
                "Esse usuário ainda não tem os cursos/permissões necessárias para ser promovido."
            );
        }

        // @ts-ignore
        if (
            !(promotedUser.roleName === "Soldado" && hasCapex) && !(promoter.roleName === "Aspirante a Oficial" && promotedUser.roleName === "Soldado") &&
            this.missingPermissions(
                promoterRequiredCourses,
                promoterObtainedPermissions
            )
        ) {
            throw new UnauthorizedException("Você ainda não pode promover.");
        }

        // @ts-ignore
        const nextRole: Roles = await this.prismaService.roles.findUnique({
            where: {
                roleIdentifier: {
                    hierarchyKind: promotedUser.role.hierarchyKind,
                    hierarchyPosition: promotedUser.role.hierarchyPosition + 1
                }
            }
        });

        if (!nextRole)
            throw new ForbiddenException(
                "Esse usuário não pode ser promovido."
            );

        let deleteCoursesPromise;
        if(nextRole.name === "Sargento")
            deleteCoursesPromise = this.prismaService.permissionsObtained.deleteMany({
                where: {
                    userId: promotedUser.id,
                    name: "ECb"
                }
            });
        else deleteCoursesPromise =
            this.prismaService.permissionsObtained.deleteMany({
                where: {
                    userId: promotedUser.id,
                    type: "COURSE"
                }
            });

        const promotePromise = this.prismaService.user.update({
            where: {
                nick: promotedUser.nick
            },
            data: {
                roleName: nextRole.name,
                bonificationsInRole: 0,
                lastPromoted: new Date()
            }
        });

        const registerPromise = this.prismaService.activityLog.create({
            data: {
                targetId: promotedUser.id,
                author: promoter.nick,
                type: "PROMOTION",
                description: description,
                newRole: nextRole.name,
                bonificationsInRole: promotedUser.bonificationsInRole
            }
        });

        await Promise.all([
            promotePromise,
            registerPromise,
            deleteCoursesPromise
        ]);
    }

    async bonifyUser(request: Request, nick: string, reason: string) {
        nick = (await this.habboService.findHabboUser(nick)).name;

        const bonifiedUser = await this.prismaService.user.findUnique({
            where: { nick },
            select: { role: true, id: true }
        }) as UserWithRole;

        if(!bonifiedUser || (bonifiedUser.role.hierarchyPosition > request["user"].role.gratifyUntilRolePosition && reason !== "Recrutamento") )
            throw new BadRequestException("Você não pode bonificar esse usuário.")

        const today = moment().startOf("day").add(3, "hours")

        // @ts-ignore
        const bonifiedTodayCount = await this.prismaService.bonification.findMany({
            where: {
                createdAt: {
                    // @ts-ignore
                    gte: today
                },
                targetId: bonifiedUser.id
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        if(bonifiedTodayCount.length >= 3)
            throw new BadRequestException("O policial já foi bonificado 3x hoje.")

        if(bonifiedTodayCount.length && reason !== "Recrutamento") {
            const lastBonified = bonifiedTodayCount.find(element => element.reason !== "Recrutamento")
            if(lastBonified && moment().diff(moment(lastBonified.createdAt), "minutes") < 30)
                throw new BadRequestException("Aguarde 30 minutos após a última bonificação deste policial antes de postar uma nova.")
        }

        await Promise.all([
            this.prismaService.user.update({
                where: { nick },
                data: {
                    bonificationsInRole: {
                        increment: 5
                    },
                    totalBonifications: {
                        increment: 5
                    }
                }
            }),
            this.prismaService.bonification.create({
                data: {
                    targetId: bonifiedUser.id,
                    reason,
                    author: request["user"].nick,
                    gains: (reason === "Recrutamento" || reason === "Atividade de Interação" ? 10 : 5)
                }
            })
        ])


    }

    async demoteMultiple(request: Request, nicks: string[], description) {
        let RHrole = request["user"].userDepartamentRole.filter(role => role.departamentRoles.departament === "RH")

        if(request["user"].roleName === "Conselheiro" || request["user"].roleName === "Supremo")
            RHrole = {
                powerLevel: 99
            }

        if(!RHrole)
            throw new UnauthorizedException("Você não tem permissão para usar o em massa.")

        for (const [index, user] of nicks.entries()) {
            if(user.length <= 1)
                continue;

            let userRealNick;
            try {
                userRealNick = (await this.habboService.findHabboUser(user)).name;
            } catch {
                throw new BadRequestException(user + " não foi encontrado no habbo.")
            }
            nicks[index] = userRealNick;

            const userInDb = await this.prismaService.user.findUnique({ where: { nick: userRealNick}, include: { role: true }})

            // @ts-ignore
            const role = await this.prismaService.roles.findUnique({
                where: {
                    roleIdentifier: {
                        hierarchyKind: (userInDb.role as Roles).hierarchyKind,
                        hierarchyPosition: (userInDb.role as Roles).hierarchyPosition - 1
                    }
                }
            })

            if(!userInDb)
                throw new BadRequestException(userRealNick + " não foi encontrado. Por favor confira os nicks antes de prosseguir.")

            if(userInDb.role.name === "Soldado" || userInDb.role.name === "Estagiário")
                throw new BadRequestException(userRealNick + " é soldado/estagiário e não pode ser rebaixado.")

            if((userInDb.role as Roles).hierarchyKind === "MILITARY" && (userInDb.role as Roles).hierarchyPosition >= 9)
                throw new BadRequestException(userRealNick + " é um Oficial-General e Oficiais-Generais acima do corpo militar não podem ser punidos pelo em massa")
        }

        const promisesToAwait = [];
        const actionId = uuid();

        for (const user of nicks) {
            if(user.length <= 1)
                continue;

            const userInDb = await this.prismaService.user.findUnique({ where: {nick: user}, select: {id: true, roleName: true, lastPromoted: true, bonificationsInRole: true, totalBonifications: true, role: true}});

            // @ts-ignore
            const role = await this.prismaService.roles.findUnique({
                where: {
                    roleIdentifier: {
                        hierarchyKind: userInDb.role.hierarchyKind,
                        hierarchyPosition: userInDb.role.hierarchyPosition - 1
                    }
                }
            }) as Roles;

            promisesToAwait.push(this.prismaService.user.update({
                where: {
                    id: userInDb.id
                },
                data: {
                    bonificationsInRole: 0,
                    roleName: role.name,
                    lastPromoted: new Date()
                }
            }))

            promisesToAwait.push(this.prismaService.permissionsObtained.deleteMany({
                where: {
                    userId: userInDb.id,
                    type: "COURSE"
                }
            }))

            if(role.hierarchyPosition === 5)
                promisesToAwait.push(this.prismaService.permissionsObtained.deleteMany({
                    where: {
                        userId: userInDb.id,
                        type: "COURSE"
                    }
                }))

            promisesToAwait.push(this.prismaService.activityLog.create({
                data: {
                    targetId: userInDb.id,
                    author: request["user"].nick,
                    type: "DEMOTION",
                    description,
                    newRole: role.name,
                    multipleId: actionId
                }
            }))

            promisesToAwait.push(this.prismaService.userBeforeAction.create({
                data: {
                    mulipleId: actionId,
                    roleName: userInDb.roleName,
                    userLastPromoted: userInDb.lastPromoted,
                    bonificationsInRole: userInDb.bonificationsInRole,
                    totalBonifications: userInDb.totalBonifications
                }
            }))
        }

        return await Promise.all(promisesToAwait);

    }


    async fireMultiple(request: Request, nicks: string[], description) {
        let RHrole = request["user"].userDepartamentRole.filter(role => role.departamentRoles.departament === "RH")

        if(request["user"].roleName === "Conselheiro" || request["user"].roleName === "Supremo")
            RHrole = {
                powerLevel: 99
            }

        if(!RHrole)
            throw new UnauthorizedException("Você não tem permissão para usar o em massa.")

        for (const [index, user] of nicks.entries()) {
            if(user.length <= 1)
                continue;

            let userRealNick;
            try {
                userRealNick = (await this.habboService.findHabboUser(user)).name;
            } catch {
                throw new BadRequestException(user + " não foi encontrado no habbo.")
            }
            nicks[index] = userRealNick;

            const userInDb = await this.prismaService.user.findUnique({ where: { nick: userRealNick}, include: { role: true }})

            if(!userInDb)
                throw new BadRequestException(userRealNick + " não foi encontrado. Por favor confira os nicks antes de prosseguir.")

            if(userInDb.role.name === "Recruta")
                throw new BadRequestException(userRealNick + " não é um policial ativo para ser demitido novamente.")

            if((userInDb.role as Roles).hierarchyKind === "MILITARY" && (userInDb.role as Roles).hierarchyPosition >= 9)
                throw new BadRequestException(userRealNick + " é um Oficial-General e Oficiais-Generais acima do corpo militar não podem ser punidos pelo em massa")
        }

        const promisesToAwait = [];
        const actionId = uuid();

        for (const user of nicks) {
            if(user.length <= 1)
                continue;

            const userInDb = await this.prismaService.user.findUnique({ where: {nick: user}, select: {id: true, roleName: true, lastPromoted: true, bonificationsInRole: true, totalBonifications: true, role: true}});

            promisesToAwait.push(this.prismaService.user.update({
                where: {
                    id: userInDb.id
                },
                data: {
                    bonificationsInRole: 0,
                    totalBonifications: 0,
                    roleName: "Recruta",
                    lastPromoted: new Date()
                }
            }))

            promisesToAwait.push(this.prismaService.permissionsObtained.deleteMany({
                where: {
                    userId: userInDb.id
                }
            }))

            promisesToAwait.push(this.prismaService.activityLog.create({
                data: {
                    targetId: userInDb.id,
                    author: request["user"].nick,
                    type: "FIRE",
                    description,
                    newRole: "Recruta",
                    multipleId: actionId
                }
            }))

            promisesToAwait.push(this.prismaService.userDepartamentRole.deleteMany({
                where: {
                    userId: userInDb.id
                }
            }))

            promisesToAwait.push(this.prismaService.userBeforeAction.create({
                data: {
                    mulipleId: actionId,
                    roleName: userInDb.roleName,
                    userLastPromoted: userInDb.lastPromoted,
                    bonificationsInRole: userInDb.bonificationsInRole,
                    totalBonifications: userInDb.totalBonifications
                }
            }))
        }

        return await Promise.all(promisesToAwait);
    }

    async warnMultiple(request: Request, nicks: string[], description) {
        let RHrole = request["user"].userDepartamentRole.filter(role => role.departamentRoles.departament === "RH")

        if(request["user"].roleName === "Conselheiro" || request["user"].roleName === "Supremo")
            RHrole = {
                powerLevel: 99
            }

        if(!RHrole)
            throw new UnauthorizedException("Você não tem permissão para usar o em massa.")

        for (const [index, user] of nicks.entries()) {
            if(user.length <= 1)
                continue;

            let userRealNick;
            try {
                userRealNick = (await this.habboService.findHabboUser(user)).name;
            } catch {
                throw new BadRequestException(user + " não foi encontrado no habbo.")
            }
            nicks[index] = userRealNick;

            const userInDb = await this.prismaService.user.findUnique({ where: { nick: userRealNick}, include: { role: true }})

            if(!userInDb)
                throw new BadRequestException(userRealNick + " não foi encontrado. Por favor confira os nicks antes de prosseguir.")

            if(userInDb.role.name === "Recruta")
                throw new BadRequestException(userRealNick + " não é um policial ativo.")

            if((userInDb.role as Roles).hierarchyKind === "MILITARY" && (userInDb.role as Roles).hierarchyPosition >= 9)
                throw new BadRequestException(userRealNick + " é um Oficial-General e Oficiais-Generais acima do corpo militar não podem ser punidos pelo em massa")
        }

        const promisesToAwait = [];
        const actionId = uuid();



        for (const user of nicks) {
            if(user.length <= 1)
                continue;

            const userInDb = await this.prismaService.user.findUnique({ where: {nick: user}, select: {id: true, advNum: true, roleName: true, lastPromoted: true, bonificationsInRole: true, totalBonifications: true, role: true}});

            if(userInDb.advNum < 2) {
                promisesToAwait.push(this.prismaService.activityLog.create({
                    data: {
                        targetId: userInDb.id,
                        author: request["user"].nick,
                        type: "WARNING",
                        description,
                        multipleId: actionId
                    }
                }))

                promisesToAwait.push(this.prismaService.user.update({
                    where: {
                        id: userInDb.id
                    },
                    data: {
                        advNum: userInDb.advNum + 1
                    }
                }))
            }

            if(userInDb.advNum === 2) {
                const role = await this.prismaService.roles.findUnique({
                    where: {
                        roleIdentifier: {
                            hierarchyKind: userInDb.role.hierarchyKind,
                            hierarchyPosition: userInDb.role.hierarchyPosition - 1
                        }
                    }
                }) as Roles;

                await this.prismaService.activityLog.create({
                    data: {
                        targetId: userInDb.id,
                        author: request["user"].nick,
                        type: "WARNING",
                        description,
                        multipleId: actionId
                    }
                })

                promisesToAwait.push(this.prismaService.activityLog.updateMany({
                    where: {
                        targetId: userInDb.id,
                        type: "WARNING"
                    },
                    data: {
                        isActive: false
                    }
                }))

                promisesToAwait.push(this.prismaService.user.update({
                    where: {
                        id: userInDb.id
                    },
                    data: {
                        bonificationsInRole: 0,
                        roleName: role.name,
                        advNum: 0,
                        lastPromoted: new Date()
                    }
                }))

                promisesToAwait.push(this.prismaService.permissionsObtained.deleteMany({
                    where: {
                        userId: userInDb.id,
                        type: "COURSE"
                    }
                }))

                if (role.hierarchyPosition === 5)
                    promisesToAwait.push(this.prismaService.permissionsObtained.deleteMany({
                        where: {
                            userId: userInDb.id,
                            type: "COURSE"
                        }
                    }))

                promisesToAwait.push(this.prismaService.activityLog.create({
                    data: {
                        targetId: userInDb.id,
                        author: "PME System",
                        type: "DEMOTION",
                        description: "Acúmulo de 3 advertências.",
                        newRole: role.name,
                        multipleId: actionId
                    }
                }))

                promisesToAwait.push(this.prismaService.userBeforeAction.create({
                    data: {
                        mulipleId: actionId,
                        roleName: userInDb.roleName,
                        userLastPromoted: userInDb.lastPromoted,
                        bonificationsInRole: userInDb.bonificationsInRole,
                        totalBonifications: userInDb.totalBonifications
                    }
                }))
            }
        }

        return await Promise.all(promisesToAwait);
    }

    async demoteUser(nick: string, description: string, request: Request) {
        nick = (await this.habboService.findHabboUser(nick)).name;
        const demotedUserPromise = this.prismaService.user.findUnique({
            where: {
                nick
            },
            include: {
                role: true
            }
        });

        const demoterPromise = this.prismaService.user.findUnique({
            where: {
                nick: request["user"].nick
            },
            include: {
                role: true
            }
        });

        // @ts-expect-error
        const [demotedUser, demoter]: {
            demotedUser: UserWithRole;
            demoter: UserWithRole;
        } = await Promise.all([demotedUserPromise, demoterPromise]);

        if (
            !demotedUser ||
            demotedUser.role.name === "Soldado" ||
            demotedUser.role.name === "Estagiário" ||
            demotedUser.role.hierarchyPosition >
                demoter.role.demoteUntilRolePosition
        ) {
            throw new UnauthorizedException(
                "Você não pode rebaixar esse usuário."
            );
        }

        const demoterRequiredCoursesPromise =
            this.prismaService.permissionsRequired.findMany({
                where: {
                    action: "DEMOTE",
                    OR: [
                        {roleName: demoter.roleName},
                        {hierarchyKind: demoter.role.hierarchyKind}
                    ]
                }
            });

        const demoterObtainedPermissionsPromise =
            this.prismaService.permissionsObtained.findMany({
                where: {
                    userId: demoter.id
                }
            });

        const [demoterRequiredCourses, demoterObtainedPermissions] =
            await Promise.all([
                demoterRequiredCoursesPromise,
                demoterObtainedPermissionsPromise
            ]);

        // @ts-ignore
        if (
            this.missingPermissions(
                demoterRequiredCourses,
                demoterObtainedPermissions
            )
        ) {
            throw new ForbiddenException(
                "Você ainda não tem permissão para rebaixar."
            );
        }

        // @ts-ignore
        const nextRole: Roles = await this.prismaService.roles.findUnique({
            where: {
                roleIdentifier: {
                    hierarchyKind: demotedUser.role.hierarchyKind,
                    hierarchyPosition: demotedUser.role.hierarchyPosition - 1
                }
            }
        });

        if (!nextRole)
            throw new ForbiddenException(
                "Esse usuário não pode ser rebaixado."
            );

        if(nextRole.hierarchyPosition === 5)
            await this.prismaService.permissionsObtained.deleteMany({
                where: {
                    userId: demotedUser.id,
                    name: "CFO"
                }
            })

        const removeCourses = this.prismaService.permissionsObtained.deleteMany({
            where: {
                userId: demotedUser.id,
                type: "COURSE"
            }
        });

        const promotePromise = this.prismaService.user.update({
            where: {
                nick: demotedUser.nick
            },
            data: {
                roleName: nextRole.name,
                bonificationsInRole: 0,
                lastPromoted: new Date()
            }
        });

        const registerPromise = this.prismaService.activityLog.create({
            data: {
                targetId: demotedUser.id,
                author: demoter.nick,
                type: "DEMOTION",
                description: description,
                newRole: nextRole.name,
            }
        });

        await Promise.all([removeCourses, promotePromise, registerPromise]);
    }
    async fireUser(nick: string, description: string, request: Request) {
        nick = (await this.habboService.findHabboUser(nick)).name;

        const firedUserPromise = this.prismaService.user.findUnique({
            where: {
                nick
            },
            include: {
                role: true
            }
        });

        const firerPromise = this.prismaService.user.findUnique({
            where: {
                nick: request["user"].nick
            },
            include: {
                role: true
            }
        });

        // @ts-expect-error
        const [firedUser, firer]: {
            firedUser: UserWithRole;
            firer: UserWithRole;
        } = await Promise.all([firedUserPromise, firerPromise]);

        if (
            !firedUser ||
            firedUser.role.name === "Recruta" ||
            firedUser.role.hierarchyPosition >
                firer.role.demoteUntilRolePosition
        ) {
            throw new UnauthorizedException(
                "Você não pode demitir esse usuário."
            );
        }

        const firerRequiredCoursesPromise =
            this.prismaService.permissionsRequired.findMany({
                where: {
                    action: "FIRE",
                    OR: [
                        {roleName: firer.roleName},
                        {hierarchyKind: firer.role.hierarchyKind}
                    ]
                }
            });

        const firerObtainedPermissionsPromise =
            this.prismaService.permissionsObtained.findMany({
                where: {
                    userId: firer.id
                }
            });

        const [firerRequiredCourses, firerObtainedPermissions] =
            await Promise.all([
                firerRequiredCoursesPromise,
                firerObtainedPermissionsPromise
            ]);

        // @ts-ignore
        if (
            this.missingPermissions(
                firerRequiredCourses,
                firerObtainedPermissions
            )
        ) {
            throw new ForbiddenException(
                "Você ainda não tem permissão para demitir."
            );
        }

        const firePromise = this.prismaService.user.update({
            where: {
                nick: firedUser.nick
            },
            data: {
                roleName: "Recruta",
                isAccountActive: false,
                bonificationsInRole: 0
            }
        });

        const registerPromise = this.prismaService.activityLog.create({
            data: {
                targetId: firedUser.id,
                author: firer.nick,
                type: "FIRE",
                description: description,
                newRole: "Recruta"
            }
        });

        const deletePermissionsPromise =
            this.prismaService.permissionsObtained.deleteMany({
                where: {
                    userId: firedUser.id
                }
            });

        const deleteRolesPromise =
            this.prismaService.userDepartamentRole.deleteMany({
                where: {
                    userId: firedUser.id
                }
            });

        await Promise.all([
            deletePermissionsPromise,
            firePromise,
            registerPromise,
            deleteRolesPromise
        ]);
    }

    async warnUser(nick: string, description: string, request: Request) {
        nick = (await this.habboService.findHabboUser(nick)).name;

        const warnedUserPromise = this.prismaService.user.findUnique({
            where: {
                nick
            },
            include: {
                role: true
            }
        });

        const warnerPromise = this.prismaService.user.findUnique({
            where: {
                nick: request["user"].nick
            },
            include: {
                role: true
            }
        });

        // @ts-expect-error
        const [warnedUser, warner]: {
            warnedUser: UserWithRole;
            warner: UserWithRole;
        } = await Promise.all([warnedUserPromise, warnerPromise]);

        if (
            !warnedUser ||
            warnedUser.roleName === "Recruta" ||
            warnedUser.role.hierarchyPosition >
                warner.role.demoteUntilRolePosition
        ) {
            throw new UnauthorizedException(
                "Você não pode advertir esse usuário."
            );
        }

        const warnerRequiredCoursesPromise =
            this.prismaService.permissionsRequired.findMany({
                where: {
                    action: "WARN",
                    OR: [
                        {roleName: warner.roleName},
                        {hierarchyKind: warner.role.hierarchyKind}
                    ]
                }
            });

        const warnerObtainedPermissionsPromise =
            this.prismaService.permissionsObtained.findMany({
                where: {
                    userId: warner.id
                }
            });

        const [warnerRequiredCourses, warnerObtainedPermissions] =
            await Promise.all([
                warnerRequiredCoursesPromise,
                warnerObtainedPermissionsPromise
            ]);

        // @ts-ignore
        if (
            this.missingPermissions(
                warnerRequiredCourses,
                warnerObtainedPermissions
            )
        ) {
            throw new ForbiddenException(
                "Você ainda não tem permissão para advertir."
            );
        }

        await this.prismaService.activityLog.create({
            data: {
                targetId: warnedUser.id,
                author: warner.nick,
                type: "WARNING",
                description: description
            }
        });

        if (warnedUser.advNum === 2) {
            // @ts-ignore
            const nextRole: Roles = await this.prismaService.roles.findUnique({
                where: {
                    roleIdentifier: {
                        hierarchyKind: warnedUser.role.hierarchyKind,
                        hierarchyPosition: warnedUser.role.hierarchyPosition - 1
                    }
                }
            });

            if (warnedUser.roleName === "Soldado")
                await this.prismaService.permissionsObtained.deleteMany({
                    where: {
                        userId: warnedUser.id
                    }
                });

            await Promise.all([
                this.prismaService.activityLog.create({
                    data: {
                        targetId: warnedUser.id,
                        author: "PME System",
                        type:
                            warnedUser.roleName === "Soldado"
                                ? "FIRE"
                                : "DEMOTION",
                        description: "Acúmulo de 3 advertências.",
                        newRole: nextRole.name
                    }
                }),
                this.prismaService.user.update({
                    where: {
                        nick: warnedUser.nick
                    },
                    data: {
                        roleName: nextRole.name,
                        isAccountActive: warnedUser.roleName !== "Soldado",
                        advNum: 0
                    }
                }),
                this.prismaService.activityLog.updateMany({
                    where: {
                        targetId: warnedUser.id,
                        type: "WARNING"
                    },
                    data: {
                        isActive: false
                    }
                })
            ]);
        } else {
            await this.prismaService.user.update({
                where: {
                    nick: warnedUser.nick
                },
                data: {
                    advNum: warnedUser.advNum + 1
                }
            });
        }
    }
}
