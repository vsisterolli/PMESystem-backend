import {
    Body,
    Controller,
    FileTypeValidator,
    Get,
    MaxFileSizeValidator,
    ParseFilePipe,
    Patch,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { AtributeCapeDTO, ChangeCapeDTO, CreateCapeDTO } from "./cosmetic.dto";
import { Request } from "express";
import { CosmeticService } from "./cosmetic.service";

@Controller("cosmetic")
export class CosmeticController {
    constructor(readonly cosmeticService: CosmeticService) {}

    // @ts-ignore
    @UseGuards(AuthGuard)
    @Post("/cape")
    @UseInterceptors(FileInterceptor("file"))
    async createCape(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: 1000000,
                        message:
                            "Tamanho limite excedido, confirme que a imagem tem menos de 1 MB."
                    }),
                    new FileTypeValidator({ fileType: ".(png|jpeg|jpg|gif)" })
                ]
            })
        )
        file: Express.Multer.File,
        @Body() data: CreateCapeDTO,
        @Req() req: Request
    ) {
        try {
            await this.cosmeticService.createCape(req, file, data);
        } catch (e) {
            return e.message;
        }
    }

    @UseGuards(AuthGuard)
    @Post("/atributeCape")
    async atributeCape(@Body() data: AtributeCapeDTO, @Req() req: Request) {
        try {
            await this.cosmeticService.atributeCape(req, data);
        } catch (e) {
            return e.message;
        }
    }

    @UseGuards(AuthGuard)
    @Get("/capes")
    async getUserCapes(@Req() req: Request) {
        return await this.cosmeticService.getUserCapes(req);
    }

    @UseGuards(AuthGuard)
    @Patch("/userCape")
    async changeUserCape(
        @Body() changeCapeDTO: ChangeCapeDTO,
        @Req() req: Request
    ) {
        return await this.cosmeticService.changeUserCape(changeCapeDTO, req);
    }
}
