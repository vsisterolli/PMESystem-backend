import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersModule } from "../users/users.module";
import { JwtModule } from "@nestjs/jwt";
import * as process from "process";
import { PrismaService } from "../prisma.service";
import {HabboService} from "../habbo/habbo.service";

@Module({
    imports: [
        UsersModule,
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: "7d" }
        })
    ],
    providers: [HabboService, PrismaService, AuthService],
    controllers: [AuthController],
    exports: [AuthService]
})
export class AuthModule {}
