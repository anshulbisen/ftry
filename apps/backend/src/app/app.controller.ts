import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import { CsrfService } from '@ftry/backend/common';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly csrfService: CsrfService,
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    const csrfToken = this.csrfService.generateToken(req, res);
    res.json({ csrfToken });
  }
}
