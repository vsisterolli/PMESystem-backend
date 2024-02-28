import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AtributeCapeDTO, ChangeCapeDTO, CreateCapeDTO } from './cosmetic.dto';
import { PrismaService } from '../prisma.service';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Request } from 'express';
import * as process from 'process';
import { Cape, User } from '@prisma/client';
import {HabboService} from "../habbo/habbo.service";

const client = new S3Client({});

@Injectable()
export class CosmeticService {

  constructor(readonly prisma: PrismaService, private habboServices: HabboService) {}

  async createCape(request, file, data: CreateCapeDTO) {
    if (!request["user"] || request["user"].isAdmin === false)
      throw new UnauthorizedException([
        "Sem permissão para realizar essa ação."
      ]);

    const isExistentCape = await this.prisma.cape.findUnique({
      where: {
        fileName: file.originalname
      }
    })

    if(isExistentCape)
      throw new ConflictException("Uma capa com esse nome de arquivo já foi criada.")

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        ACL: "public-read",
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype
      });
      // @ts-ignore
      await client.send(command);

      await this.prisma.cape.create({
        data: {
          name: data.capeName,
          fileName: file.originalname
        }
      })

    } catch(e) {
      console.log(e);
    }
  }

  async atributeCape(request: Request, data: AtributeCapeDTO) {
    if (!request["user"] || request["user"].isAdmin === false)
      throw new UnauthorizedException([
        "Sem permissão para realizar essa ação."
      ]);

    data.userNick = (await this.habboServices.findHabboUser(data.userNick)).name;

    const userPromise = this.prisma.user.findUnique({
      where: {
        nick: data.userNick
      }
    })

    const capePromise = this.prisma.cape.findUnique({
      where: {
        name: data.capeName
      }
    })

    // @ts-expect-error
    const [user, cape] : {user: User, cape: Cape} = await Promise.all([userPromise, capePromise]);

    if(!user)
      throw new NotFoundException("Usuário não encontrado")
    if(!cape)
      throw new NotFoundException("Capa não encontrada")

    await this.prisma.capesAtribbuted.create({
      data: {
        userId: user.id,
        capeId: cape.id
      }
    })
  }

  async getUserCapes(request: Request) {
    if(request["user"].isAdmin)
      return this.prisma.cape.findMany();

    const user = await this.prisma.user.findUnique({
      where: {
        nick: request["user"].nick
      },
      include: {
        capesAtribbuted: {
          select: {
            cape: {
              select: {
                fileName: true,
                name: true
              }
            }
          }
        }
      }
    })

    if(!user)
      throw new NotFoundException("Usuário não encontrado")

    return user.capesAtribbuted;
  }

  async changeUserCape(data: ChangeCapeDTO, request: Request) {
    await this.prisma.user.update({
      where: {
        nick: request["user"].nick
      },
      data: {
        capeSelected: data.capeName
      }
    })
  }

}
