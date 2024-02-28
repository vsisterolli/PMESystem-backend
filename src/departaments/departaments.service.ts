import {BadRequestException, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {Request} from "express";
import {PrismaService} from "../prisma.service";
import {power, search} from "ionicons/icons";
import {PostClassDTO} from "./departaments.dtos";
import {Course, Departament, User} from "@prisma/client";
import {UsersService} from "../users/users.service";
import {HabboService} from "../habbo/habbo.service";

@Injectable()
export class DepartamentsService {

  constructor(private prismaService: PrismaService, private habboService: HabboService) {
  };

  async getCoursesAllowedToPost(request: Request) {
    if(request["user"].roleName === "Conselheiro" || request["user"].roleName === "Supremo") {
      return this.prismaService.course.findMany({
        select: {
          acronym: true,
          departament: true
        }
      })
    }

    let userRole;
    request["user"].userDepartamentRole.forEach(role => {
      if(role.departament === "INS" || role.departament === "EFEX" || role.departament === "CDO" || role.departament === "ESP")
        userRole = role;
    })

    if(!userRole)
      return [];

    return this.prismaService.course.findMany({
      where: {
        departament: userRole.departament,
        powerNeeded: {
          lte: userRole.powerLevel
        }
      }
    })
  }

  async getCourse(request: Request, acronym: string) {
    const course = await this.prismaService.course.findUnique({
      where: {
        acronym
      }
    }) as Course

    if(!course)
      throw new NotFoundException("Curso inexistente");

    let userRole;

    if (request["user"].roleName === "Supremo" || request["user"].roleName === "Conselheiro")
      userRole = {
        powerLevel: 1000
      }

    else request["user"].departamentRoles.forEach(role => {
      if(role.departament === course.departament)
        userRole = role;
    })

    if(!userRole)
      throw new UnauthorizedException("Sem permissão para acessar o curso.")

    return course;
  }

  async getDepartamentCourses(request: Request, departament: string) {

    let userRole;

    if (request["user"].roleName === "Supremo" || request["user"].roleName === "Conselheiro")
      userRole = {
        powerLevel: 1000
      }

    else request["user"].departamentRoles.forEach(role => {
      if (role.departament === departament)
        userRole = role;
    })

    if (!userRole)
      throw new UnauthorizedException("Você não tem permissão para ver essa função.");

    // @ts-ignore
    return this.prismaService.course.findMany({
      where: {
        // @ts-ignore
        departament: departament.toUpperCase(),
        powerNeeded: {
          lte: userRole.powerLevel
        }
      }
    })
  }

  async getDepartamentClasses(request: Request, query: {
    departament: string,
    offset: string | null,
    search: string | null,
    mode: "mine" | "all"
  }) {
    let userRole;

    if (request["user"].roleName === "Supremo" || request["user"].roleName === "Conselheiro")
      userRole = {
        powerLevel: 1000
      }

    else request["user"].departamentRoles.forEach(role => {
      if (role.departament === query.departament)
        userRole = role;
    })

    if (!userRole) {
      throw new UnauthorizedException("Você não tem permissão para ver essa função.");
    }
    const COORD_POWER = 10;
    if (query.mode === "all" && userRole.powerLevel < COORD_POWER)
      throw new UnauthorizedException("Você só pode ver suas próprias aulas.");


    const sql = {
      where: {
        departament: query.departament.toUpperCase(),
      },
      take: 10,
      orderBy: [
        { appliedAt: "desc" }
      ]
    }


    if (query.mode === "mine")
      sql.where["author"] = request["user"].nick;

    if (query.offset) sql["skip"] = Number(query.offset)



    const isNum = (str) => {
      return !isNaN(str) && !isNaN(parseFloat(str))
    }

    if (query.search && query.search !== "")
      sql.where["OR"] = [
        {author: {contains: query.search}},
        {approved: {contains: query.search}},
        {id: {equals: isNum(query.search) ? Number(query.search) : -1}},
        {failed: {contains:  query.search}},
        {courseAcronym: {contains: query.search}},
        {room: {contains: query.search}}
      ]

    // @ts-ignore
    return this.prismaService.$transaction([
      // @ts-ignore
      this.prismaService.classes.count({where: sql.where}),
      // @ts-ignore
      this.prismaService.classes.findMany(sql)
    ])

  }


  async postClass(request: Request, data: PostClassDTO) {
    const course = await this.prismaService.course.findUnique({
      where: {
        acronym: data.courseAcronym
      }
    }) as Course;

    let userRole;

    if (request["user"].roleName === "Supremo" || request["user"].roleName === "Conselheiro")
      userRole = {
        powerLevel: 1000
      }

    else request["user"].departamentRoles.forEach(role => {
      if (role.departament === course.departament)
        userRole = role;
    })

    if(!userRole || userRole.powerLevel < course.powerNeeded)
      throw new UnauthorizedException("Sem autorização.")


    for (const user of data.approved) {
      const index = data.approved.indexOf(user);
      try {
        data.approved[index] = (await this.habboService.findHabboUser(user)).name;
      } catch {
        throw new BadRequestException("Um dos aprovados não existe no habbo, confirme os nicks antes de tentar novamente.");
      }
    }

    if(data.courseAcronym === "CFPM") {
        for (const user of data.approved) {
          try {
            await this.prismaService.user.create({data: {nick: user}});
          } catch {
            continue;
          }
        }
    }

    const activityLogData = [], permissionObtainedData = [];
    for(const user of data.approved) {
      const userObj = await this.prismaService.user.findUnique({ where: {nick: user} }) as User;
      if(!userObj)
        throw new BadRequestException("Um dos usuários não pode receber o curso por não estar cadastrado no system.")

      permissionObtainedData.push({
        userId: userObj.id,
        name: course.acronym,
        fullName: course.name,
        type: "COURSE"
      })
      activityLogData.push({
        author: request["user"].nick,
        targetId: userObj.id,
        type: "APPROVATION",
        description: data.description,
        courseAcronym: data.courseAcronym
      })
    }

    try {
      await Promise.all([
        this.prismaService.permissionsObtained.createMany({data: permissionObtainedData}),
        this.prismaService.activityLog.createMany({data: activityLogData}),
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
      ])
    } catch {
      throw new BadRequestException("Algum dos usuários já tem esse curso ativo.")
    }
  }
}


