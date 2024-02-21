import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import * as process from "process";
import { PrismaService } from "../prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prismaService: PrismaService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        try {
            let token;
            if(process.env.LOCAL === "TRUE")
                token = this.extractTokenFromHeader(request);
            else
                token = this.extractTokenFromCookies(request);

            if (!token) {
                throw new UnauthorizedException("");
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET
            });

            request["user"] = await this.prismaService.user.findUnique({
                where: {
                    nick: payload.nick
                }
            });
        } catch (e) {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromCookies(request: Request): string | undefined {
        const [, token] = request.cookies.token.split("Bearer ");
        return token;
    }

    private extractTokenFromHeader(request: Request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}