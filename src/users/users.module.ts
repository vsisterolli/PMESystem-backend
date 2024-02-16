import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma.service';
import { HabboService } from '../habbo/habbo.service';

@Module({
  providers: [PrismaService, UsersService, HabboService],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
