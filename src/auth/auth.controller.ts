import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { SignInDTO } from './auth.dtos';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async signIn(@Body() signInDto: SignInDTO, @Res() res: Response) {
    const jwt = await this.authService.signIn(signInDto.nick, signInDto.password)
    res.cookie('token', jwt.access_token, {httpOnly: true, secure: true})
    return res.send("Oi!")
  }


  @HttpCode(HttpStatus.CREATED)
  @Post('session')
  createSession() {
    return this.authService.createAuthSession();
  }
}
