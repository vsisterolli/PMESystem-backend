import { Module } from '@nestjs/common';
import { CosmeticController } from './cosmetic.controller';
import { CosmeticService } from './cosmetic.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CosmeticController],
  providers: [PrismaService, CosmeticService]
})
export class CosmeticModule {}
