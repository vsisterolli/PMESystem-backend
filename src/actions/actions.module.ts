import { Module } from "@nestjs/common";
import { ActionsController } from "./actions.controller";
import { ActionsService } from "./actions.service";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";

@Module({
    controllers: [ActionsController],
    providers: [ActionsService, JwtService, PrismaService]
})
export class ActionsModule {}
