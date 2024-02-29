import { Module } from "@nestjs/common";
import { DepartamentsController } from "./departaments.controller";
import { DepartamentsService } from "./departaments.service";
import { PrismaService } from "../prisma.service";
import { HabboService } from "../habbo/habbo.service";

@Module({
    controllers: [DepartamentsController],
    providers: [HabboService, PrismaService, DepartamentsService]
})
export class DepartamentsModule {}
