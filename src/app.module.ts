import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HabboService } from './habbo/habbo.service';
import { ActionsModule } from './actions/actions.module';

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: '.env'
  }), AuthModule, UsersModule, ActionsModule],
  providers: [PrismaService, HabboService],
})
export class AppModule {}
