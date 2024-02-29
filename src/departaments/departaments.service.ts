import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from "@nestjs/common";
import { Request } from "express";
import { PrismaService } from "../prisma.service";
import {DeleteUserDTO, PostClassDTO, PostRoleDTO} from "./departaments.dtos";
import { Course, DepartamentRole, User } from "@prisma/client";
import { HabboService } from "../habbo/habbo.service";

@Injectable()
export class DepartamentsService {
    constructor(
        private prismaService: PrismaService,
        private habboService: HabboService
    ) {}

    async deleteUserRole(request: Request, deleteUserDTO: DeleteUserDTO) {
        let applierRole;
        if (
          request["user"].roleName === "Supremo" ||
          request["user"].roleName === "Conselheiro"
        )
            applierRole = {
                powerLevel: 1000
            }
        else
            request["user"].userDepartamentRole.forEach(
              (applierCurrentRole) => {
                  if (
                    deleteUserDTO.departament ===
                    applierCurrentRole.departamentRoles.departament
                  )
                      applierRole = applierCurrentRole.departamentRoles;
              }
            );

        const user = await this.prismaService.user.findUnique({
            where: {
                nick: deleteUserDTO.userNick
            },
            select: {
                id: true,
                userDepartamentRole: {
                    select: {
                        departamentRoles: {
                            select: {
                                id: true,
                                powerLevel: true,
                                departament: true
                            }
                        }
                    }
                }
            }
        });

        let userRole;
        // @ts-ignore
        user.userDepartamentRole.forEach(role => {
            // @ts-ignore
            if(role.departamentRoles.departament === deleteUserDTO.departament)
                userRole = role.departamentRoles;
        })
        if(!userRole)
            throw new NotFoundException("Usuário não encontrado.");

        if(applierRole.powerLevel <= userRole.powerLevel)
            throw new UnauthorizedException("Você não pode remover esse usuário da função.")

        console.log(userRole)
        // @ts-ignore
        await this.prismaService.userDepartamentRole.delete({
            // @ts-ignore
            where: {
                departamentIdentifier: {
                    userId: user.id,
                    departamentRoleId: userRole.id
                },
            }
        })
    }

    async getChangeableRoles(request: Request, departament: string) {
        let applierRole;
        if (
            request["user"].roleName === "Supremo" ||
            request["user"].roleName === "Conselheiro"
        )
            applierRole = {
                powerLevel: 1000
            };
        else
            request["user"].userDepartamentRole.forEach(
                (applierCurrentRole) => {
                    if (
                        departament ===
                        applierCurrentRole.departamentRoles.departament
                    )
                        applierRole = applierCurrentRole.departamentRoles;
                }
            );

        if (!applierRole)
            throw new UnauthorizedException(
                "Sem permissão para gerenciar essa função."
            );

        // @ts-ignore
        return this.prismaService.departamentRole.findMany({
            where: {
                // @ts-ignore
                departament,
                powerLevel: {
                    lt: applierRole.powerLevel
                }
            },
            select: {
                name: true
            }
        });
    }

    async getUsersFromDepartament(departament) {
        return this.prismaService.userDepartamentRole.findMany({
            where: {
                departament
            },
            select: {
                user: {
                    select: {
                        nick: true
                    }
                },
                departamentRoles: {
                    select: {
                        name: true,
                        departament: true
                    }
                },
                createdAt: true
            }
        });
    }

    async setUserRole(request: Request, data: PostRoleDTO) {
        const role = (await this.prismaService.departamentRole.findUnique({
            where: {
                name: data.roleName
            }
        })) as DepartamentRole;

        const user = (await this.prismaService.user.findUnique({
            where: {
                nick: data.userNick
            }
        })) as User;

        if (!user || !role)
            throw new NotFoundException("Cargo e/ou usuário não encontrado.");
        if (user.roleName === "Recruta")
            throw new Error("Você não pode dar um cargo para esse usuário...");

        let applierRole;

        if (
            request["user"].roleName === "Supremo" ||
            request["user"].roleName === "Conselheiro"
        )
            applierRole = {
                powerLevel: 1000
            };
        else
            request["user"].userDepartamentRole.forEach(
                (applierCurrentRole) => {
                    if (
                        role.departament ===
                        applierCurrentRole.departamentRoles.departament
                    )
                        applierRole = applierCurrentRole.departamentRoles;
                }
            );

        if (!applierRole || applierRole.powerLevel <= role.powerLevel)
            throw new UnauthorizedException(
                "Você não tem permissão para distribuir esse cargo."
            );

        await this.prismaService.userDepartamentRole.deleteMany({
            where: {
                userId: user.id,
                departament: role.departament
            }
        });

        await this.prismaService.userDepartamentRole.create({
            data: {
                userId: user.id,
                departament: role.departament,
                departamentRoleId: role.id
            }
        });
    }

    async getCoursesAllowedToPost(request: Request) {
        if (
            request["user"].roleName === "Conselheiro" ||
            request["user"].roleName === "Supremo"
        ) {
            return this.prismaService.course.findMany({
                select: {
                    acronym: true,
                    departament: true
                }
            });
        }

        let userRole;
        request["user"].userDepartamentRole.forEach((role) => {
            if (
                role.departament === "INS" ||
                role.departament === "EFEX" ||
                role.departament === "CDO" ||
                role.departament === "ESP"
            )
                userRole = role;
        });

        if (!userRole) return [];

        return this.prismaService.course.findMany({
            where: {
                departament: userRole.departament,
                powerNeeded: {
                    lte: userRole.powerLevel
                }
            }
        });
    }

    async getCourse(request: Request, acronym: string) {
        const course = (await this.prismaService.course.findUnique({
            where: {
                acronym
            }
        })) as Course;

        if (!course) throw new NotFoundException("Curso inexistente");

        let userRole;

        if (
            request["user"].roleName === "Supremo" ||
            request["user"].roleName === "Conselheiro"
        )
            userRole = {
                powerLevel: 1000
            };
        else
            request["user"].departamentRoles.forEach((role) => {
                if (role.departamentRoles.departament === course.departament)
                    userRole = role.departamentRoles;
            });

        if (!userRole)
            throw new UnauthorizedException(
                "Sem permissão para acessar o curso."
            );

        return course;
    }

    async getDepartamentCourses(request: Request, departament: string) {
        let userRole;

        if (
            request["user"].roleName === "Supremo" ||
            request["user"].roleName === "Conselheiro"
        )
            userRole = {
                powerLevel: 1000
            };
        else
            request["user"].departamentRoles.forEach((role) => {
                if (role.departamentRoles.departament === departament)
                    userRole = role.departamentRoles;
            });

        if (!userRole)
            throw new UnauthorizedException(
                "Você não tem permissão para ver essa função."
            );

        // @ts-ignore
        return this.prismaService.course.findMany({
            where: {
                // @ts-ignore
                departament: departament.toUpperCase(),
                powerNeeded: {
                    lte: userRole.powerLevel
                }
            }
        });
    }

    async getDepartamentClasses(
        request: Request,
        query: {
            departament: string;
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
            request["user"].departamentRoles.forEach((role) => {
                if (role.departamentRoles.departament === query.departament)
                    userRole = role.departamentRoles;
            });

        if (!userRole) {
            throw new UnauthorizedException(
                "Você não tem permissão para ver essa função."
            );
        }
        const COORD_POWER = 10;
        if (query.mode === "all" && userRole.powerLevel < COORD_POWER)
            throw new UnauthorizedException(
                "Você só pode ver suas próprias aulas."
            );

        const sql = {
            where: {
                departament: query.departament.toUpperCase()
            },
            take: 10,
            orderBy: [{ appliedAt: "desc" }]
        };

        if (query.mode === "mine") sql.where["author"] = request["user"].nick;

        if (query.offset) sql["skip"] = Number(query.offset);

        const isNum = (str) => {
            return !isNaN(str) && !isNaN(parseFloat(str));
        };

        if (query.search && query.search !== "")
            sql.where["OR"] = [
                { author: { contains: query.search } },
                { approved: { contains: query.search } },
                {
                    id: {
                        equals: isNum(query.search) ? Number(query.search) : -1
                    }
                },
                { failed: { contains: query.search } },
                { courseAcronym: { contains: query.search } },
                { room: { contains: query.search } }
            ];

        // @ts-ignore
        return this.prismaService.$transaction([
            // @ts-ignore
            this.prismaService.classes.count({ where: sql.where }),
            // @ts-ignore
            this.prismaService.classes.findMany(sql)
        ]);
    }

    async postClass(request: Request, data: PostClassDTO) {
        const course = (await this.prismaService.course.findUnique({
            where: {
                acronym: data.courseAcronym
            }
        })) as Course;

        let userRole;

        if (
            request["user"].roleName === "Supremo" ||
            request["user"].roleName === "Conselheiro"
        )
            userRole = {
                powerLevel: 1000
            };
        else
            request["user"].departamentRoles.forEach((role) => {
                if (role.departamentRoles.departament === course.departament)
                    userRole = role;
            });

        if (!userRole || userRole.powerLevel < course.powerNeeded)
            throw new UnauthorizedException("Sem autorização.");

        for (const user of data.approved) {
            const index = data.approved.indexOf(user);
            try {
                data.approved[index] = (
                    await this.habboService.findHabboUser(user)
                ).name;
            } catch {
                throw new BadRequestException(
                    "Um dos aprovados não existe no habbo, confirme os nicks antes de tentar novamente."
                );
            }
        }

        if (data.courseAcronym === "CFPM") {
            for (const user of data.approved) {
                try {
                    await this.prismaService.user.create({
                        data: { nick: user }
                    });
                } catch {
                    continue;
                }
            }
        }

        const activityLogData = [],
            permissionObtainedData = [],
            removePromise = [];
        for (const user of data.approved) {
            const userObj = (await this.prismaService.user.findUnique({
                where: { nick: user }
            })) as User;
            if (!userObj)
                throw new BadRequestException(
                    "Um dos usuários não pode receber o curso por não estar cadastrado no system."
                );

            removePromise.push(
                this.prismaService.permissionsObtained.deleteMany({
                    where: { userId: userObj.id }
                })
            );
            permissionObtainedData.push({
                userId: userObj.id,
                name: course.acronym,
                fullName: course.name,
                type: "COURSE"
            });
            if (
                course.acronym === "CDO" ||
                course.acronym === "ESbt" ||
                course.acronym === "CAPeX"
            ) {
                permissionObtainedData.push({
                    userId: userObj.id,
                    name: course.acronym,
                    fullName: course.name,
                    type: "OTHER"
                });
            }
            activityLogData.push({
                author: request["user"].nick,
                targetId: userObj.id,
                type: "APPROVATION",
                description: data.description,
                courseAcronym: data.courseAcronym
            });
        }

        try {
            await Promise.all([
                ...removePromise,
                this.prismaService.permissionsObtained.createMany({
                    data: permissionObtainedData
                }),
                this.prismaService.activityLog.createMany({
                    data: activityLogData
                }),
                this.prismaService.classes.create({
                    data: {
                        courseAcronym: course.acronym,
                        author: request["user"].nick,
                        approved: data.approved.join(" | "),
                        failed: data.failed.join(" | "),
                        room: data.room,
                        departament: course.departament
                    }
                })
            ]);
        } catch {
            throw new BadRequestException(
                "Algum dos usuários já tem esse curso ativo."
            );
        }
    }
}
