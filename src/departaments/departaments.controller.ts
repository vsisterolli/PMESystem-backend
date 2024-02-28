import {Body, Controller, Get, NotFoundException, Param, Post, Query, Req, Res, UseGuards} from '@nestjs/common';
import {AuthGuard} from "../auth/auth.guard";
import {Request, Response} from "express";
import {DepartamentsService} from "./departaments.service";
import {PostClassDTO} from "./departaments.dtos";

@Controller('departaments')
export class DepartamentsController {

  constructor(private departamentServices: DepartamentsService) {};

  @UseGuards(AuthGuard)
  @Get("/courses/:departament")
  async getCoursesFromDepartament(
    @Req() req: Request,
    @Param('departament') departament
  ) {
    try {
      return await this.departamentServices.getDepartamentCourses(req, departament);
    } catch (e) {
      throw new NotFoundException("Função inexistente.")
    }
  }

  @UseGuards(AuthGuard)
  @Get("/coursesAllowedToPost")
  async getCoursesAllowedToPost(
    @Req() req: Request,
  ) {
    try {
      return await this.departamentServices.getCoursesAllowedToPost(req);
    } catch (e) {
      throw new NotFoundException("Função inexistente.")
    }
  }

  @UseGuards(AuthGuard)
  @Get("/course/:acronym")
  async getCourse (
    @Req() req: Request,
    @Param("acronym") acronym
  ){
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
      return await this.departamentServices.getDepartamentClasses(req, { departament, mode, offset, search});
    } catch (e) {
      console.log(e)
    }
  }

  @UseGuards(AuthGuard)
  @Post("/class")
  async postClass (
    @Req() req: Request,
    @Body() postClassDTO: PostClassDTO
  ){
    return await this.departamentServices.postClass(req, postClassDTO);
  }
}
