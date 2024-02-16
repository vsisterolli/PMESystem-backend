import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService
) {}


  async signIn(nick: string, password: string): Promise<any> {
    const user = await this.usersService.findByName(nick);
    if (user?.isAccountActive === false || bcrypt.compareSync(password, user.password) === false) {
      throw new UnauthorizedException();
    }

    const payload = {  nick };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }


  async createAuthSession() {

    // generates a 5 digits code from 00000 to 99999
    const codeBase = Math.floor(Math.random() * 99999)
    const code = codeBase.toString().padStart(5, '0')

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    return this.prisma.session.create({
      data: {
        code,
        expiresAt
      }
    })
  }

  async createRole(data: Prisma.RolesCreateArgs) {
    this.prisma.roles.create({
      data
    })
  }
}
