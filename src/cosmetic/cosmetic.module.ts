import { Module } from '@nestjs/common';
import { CosmeticController } from './cosmetic.controller';
import { CosmeticService } from './cosmetic.service';
import { PrismaService } from '../prisma.service';
import {HabboService} from "../habbo/habbo.service";

@Module({
  controllers: [CosmeticController],
  providers: [HabboService, PrismaService, CosmeticService]
})
export class CosmeticModule {}
