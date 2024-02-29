import {
    Body,
    Controller, Delete,
    Get,
    NotFoundException,
    Param,
    Post,
    Query,
    Req,
    UseGuards
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { Request } from "express";
import { DepartamentsService } from "./departaments.service";
import {DeleteUserDTO, PostClassDTO, PostRoleDTO} from "./departaments.dtos";

@Controller("departaments")
export class DepartamentsController {
    constructor(private departamentServices: DepartamentsService) {}

    @UseGuards(AuthGuard)
    @Get("/roles/:departament")
    async getChangeabeRolesFromDepartament(
        @Req() req: Request,
        @Param("departament") departament: string
    ) {
        try {
            return await this.departamentServices.getChangeableRoles(
                req,
                departament.toUpperCase()
            );
        } catch (e) {
            throw new NotFoundException("Função inexistente.");
        }
    }

    @UseGuards(AuthGuard)
    @Get("/courses/:departament")
    async getCoursesFromDepartament(
        @Req() req: Request,
        @Param("departament") departament
    ) {
        try {
            return await this.departamentServices.getDepartamentCourses(
                req,
                departament
            );
        } catch (e) {
            throw new NotFoundException("Função inexistente.");
        }
    }

    @UseGuards(AuthGuard)
    @Get("/coursesAllowedToPost")
    async getCoursesAllowedToPost(@Req() req: Request) {
        try {
            return await this.departamentServices.getCoursesAllowedToPost(req);
        } catch (e) {
            throw new NotFoundException("Função inexistente.");
        }
    }

    @UseGuards(AuthGuard)
    @Get("/course/:acronym")
    async getCourse(@Req() req: Request, @Param("acronym") acronym) {
        return await this.departamentServices.getCourse(req, acronym);
    }

    @UseGuards(AuthGuard)
    @Get("/classes")
    async getClassesFromDepartament(
        @Req() req: Request,
        @Query("departament") departament: string,
        @Query("mode") mode: "mine" | "all",
        @Query("offset") offset: string | null,
        @Query("search") search: string | null
    ) {
        try {
            return await this.departamentServices.getDepartamentClasses(req, {
                departament,
                mode,
                offset,
                search
            });
        } catch (e) {
            console.log(e);
        }
    }

    @UseGuards(AuthGuard)
    @Post("/class")
    async postClass(@Req() req: Request, @Body() postClassDTO: PostClassDTO) {
        return await this.departamentServices.postClass(req, postClassDTO);
    }

    @UseGuards(AuthGuard)
    @Post("/user/role")
    async postUserRole(@Req() req: Request, @Body() postRoleDto: PostRoleDTO) {
        return await this.departamentServices.setUserRole(req, postRoleDto);
    }

    @UseGuards(AuthGuard)
    @Delete("/user")
    async deleteUserRole(@Req() req: Request,
                         @Query("departament") departament: string,
                         @Query("userNick") userNick: string
    ) {
        return await this.departamentServices.deleteUserRole(req, { departament: departament.toUpperCase(), userNick: userNick });
    }

    @UseGuards(AuthGuard)
    @Get("/users/:departament")
    async getDepartamentUsers(
        @Req() req: Request,
        @Param("departament") departament: string
    ) {
        return await this.departamentServices.getUsersFromDepartament(
            departament.toUpperCase()
        );
    }
}
