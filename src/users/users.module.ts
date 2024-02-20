import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { PrismaService } from "../prisma.service";
import { HabboService } from "../habbo/habbo.service";
import { AuthGuard } from '../auth/auth.guard';

@Module({
    providers: [PrismaService, UsersService, HabboService, AuthGuard],
    exports: [UsersService],
    controllers: [UsersController]
})
export class UsersModule {}
