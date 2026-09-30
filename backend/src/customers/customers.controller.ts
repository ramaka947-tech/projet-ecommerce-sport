import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { CustomerAuthGuard } from './customer-auth.guard.js';

@Controller('customer-auth')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

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
  @Get('orders')
@UseGuards(CustomerAuthGuard)
getOrders(@Request() req: any) {
  return this.customersService.getOrders(req.user.sub);
}

}