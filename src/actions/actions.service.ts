import {
    ForbiddenException,
    Injectable,
    UnauthorizedException
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Request } from "express";
import * as moment from "moment";
import {
    PermissionsObtained,
    PermissionsRequired,
    Prisma,
    Roles
} from "@prisma/client";

type UserWithRole = Prisma.UserGetPayload<{
    include: { role: true };
}>;

@Injectable()
export class ActionsService {
    constructor(private prismaService: PrismaService) {}

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
                    roleName: promotedUser.roleName
                }
            });

        const promoterRequiredCoursesPromise =
            this.prismaService.permissionsRequired.findMany({
                where: {
                    action: "PROMOTE",
                    roleName: promoter.roleName
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

        const deleteCoursesPromise =
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
                roleName: nextRole.name
            }
        });

        const registerPromise = this.prismaService.activityLog.create({
            data: {
                targetId: promotedUser.id,
                author: promoter.nick,
                type: "PROMOTION",
                description: description,
                newRole: nextRole.name
            }
        });

        await Promise.all([
            promotePromise,
            registerPromise,
            deleteCoursesPromise
        ]);
    }

    async demoteUser(nick: string, description: string, request: Request) {
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
                    roleName: demoter.roleName
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

        const promotePromise = this.prismaService.user.update({
            where: {
                nick: demotedUser.nick
            },
            data: {
                roleName: nextRole.name
            }
        });

        const registerPromise = this.prismaService.activityLog.create({
            data: {
                targetId: demotedUser.id,
                author: demoter.nick,
                type: "DEMOTION",
                description: description,
                newRole: nextRole.name
            }
        });

        await Promise.all([promotePromise, registerPromise]);
    }
    async fireUser(nick: string, description: string, request: Request) {
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
                    roleName: firer.roleName
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
                isAccountActive: false
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
                    roleName: warner.roleName
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
