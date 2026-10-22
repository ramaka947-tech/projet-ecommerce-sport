import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { CustomerAuthGuard } from './customer-auth.guard.js';

@Controller('customer-auth')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Post('register')
  register(@Body() body: any) {
    return this.customersService.register(body);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.customersService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  me(@Request() req: any) {
    return this.customersService.findOne(req.user.sub);
  }

  // AJOUT : modifier mes informations
  @Patch('me')
  @UseGuards(CustomerAuthGuard)
  updateMe(
    @Request() req: any,
    @Body() body: { name?: string; phone?: string; region?: string; address?: string },
  ) {
    return this.customersService.updateProfile(req.user.sub, body);
  }

  @Get('orders')
  @UseGuards(CustomerAuthGuard)
  getOrders(@Request() req: any) {
    return this.customersService.getOrders(req.user.sub);
  }

  @Get('orders/:id')
  @UseGuards(CustomerAuthGuard)
  getOrder(@Request() req: any, @Param('id') id: string) {
    return this.customersService.getOrder(req.user.sub, id);
  }

  @Patch('orders/:id/cancel')
  @UseGuards(CustomerAuthGuard)
  cancelOrder(@Request() req: any, @Param('id') id: string) {
    return this.customersService.cancelOrder(req.user.sub, id);
  }

  @Get('saved')
  @UseGuards(CustomerAuthGuard)
  getSaved(@Request() req: any) {
    return this.customersService.getSaved(req.user.sub);
  }

  @Put('saved')
  @UseGuards(CustomerAuthGuard)
  saveSaved(@Request() req: any, @Body() body: { cart?: any[]; favorites?: any[] }) {
    return this.customersService.saveSaved(req.user.sub, body);
  }

  @Get('messages')
  @UseGuards(CustomerAuthGuard)
  getMessages(@Request() req: any) {
    return this.customersService.getMessages(req.user.sub);
  }

  // Continuer une discussion : ajoute une réponse du client à un de ses messages
  @Post('messages/:id/entries')
  @UseGuards(CustomerAuthGuard)
  addMessageEntry(
    @Request() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.customersService.addMessageEntry(req.user.sub, id, content);
  }
}