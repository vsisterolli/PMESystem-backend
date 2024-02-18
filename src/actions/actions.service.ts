import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Request } from 'express';
import * as moment from "moment";
import { PermissionsObtained, PermissionsRequired, Prisma, Roles } from '@prisma/client';

type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true }
}>

@Injectable()
export class ActionsService {

  constructor(private prismaService: PrismaService) {}

  missingPermissions(needed: PermissionsRequired[], obtained: PermissionsObtained[]): boolean {
    const permissionExists: Map<string, boolean> = new Map();
    obtained.forEach(permission => permissionExists.set(permission.name, true))
    for(const permission of needed) {
      if(permissionExists.has(permission.name) === false)
        return true;
    }
    return false;
  }

  async promoteUser(nick: string, request: Request) {
    const promotedUserPromise = this.prismaService.user.findUnique({
      where: {
        nick
      },
      include: {
        role: true
      },
    })

    const promoterPromise = this.prismaService.user.findUnique({
      where: {
        nick: request["user"].nick
      },
      include: {
        role: true
      }
    })

    // @ts-ignore
    const [promotedUser, promoter] : { promotedUser: UserWithRole, promoter: UserWithRole } = await Promise.all([promotedUserPromise, promoterPromise])

    if(!promotedUser || promotedUser.role.hierarchyPosition > promoter.role.promotesUntilRolePosition) {
      throw new UnauthorizedException(["Você não pode promover esse usuário."])
    }

    const daysInRole = moment().diff(moment(promotedUser.lastPromoted), 'days')
    if(daysInRole < promotedUser.role.daysToBePromoted) {
      throw new ForbiddenException(["Esse usuário ainda não atingiu o tempo mínimo para ser promovido."])
    }

    const promotedRequiredCoursesPromise = this.prismaService.permissionsRequired.findMany({
      where: {
        action: "BE_PROMOTED",
        roleName: promotedUser.roleName
      }
    })

    const promoterRequiredCoursesPromise = this.prismaService.permissionsRequired.findMany({
      where: {
        action: "PROMOTE",
        roleName: promoter.roleName
      }
    })

    const promotedObtainedPermissionsPromise = this.prismaService.permissionsObtained.findMany({
      where: {
        userNick: promotedUser.nick
      }
    })

    const promoterObtainedPermissionsPromise = this.prismaService.permissionsObtained.findMany({
      where: {
        userNick: promoter.nick
      }
    })

    const [
        promotedRequiredCourses,
        promoterRequiredCourses,
        promotedObtainedPermissions,
        promoterObtainedPermissions,
      ] = await Promise.all([
        promotedRequiredCoursesPromise,
        promoterRequiredCoursesPromise,
        promotedObtainedPermissionsPromise,
        promoterObtainedPermissionsPromise,
    ])

    // @ts-ignore
    if(this.missingPermissions(promotedRequiredCourses, promotedObtainedPermissions)) {
      throw new ForbiddenException(["Esse usuário ainda não tem os cursos/permissões necessárias para ser promovido."])
    }

    // @ts-ignore
    if(this.missingPermissions(promoterRequiredCourses, promoterObtainedPermissions)) {
      throw new UnauthorizedException(["Você ainda não pode promover."])
    }

    // @ts-ignore
    const nextRole: Roles = await this.prismaService.roles.findUnique({
      where: {
        roleIdentifier: {
          hierarchyKind: promotedUser.role.hierarchyKind,
          hierarchyPosition: promotedUser.role.hierarchyPosition + 1
        }
      }
    })

    if(!nextRole)
      throw new ForbiddenException(["Esse usuário não pode ser promovido."])

    const updatePromise = this.prismaService.user.update({
      where: {
        nick: promotedUser.nick
      },
      data: {
        roleName: nextRole.name
      }
    })


  }
}
