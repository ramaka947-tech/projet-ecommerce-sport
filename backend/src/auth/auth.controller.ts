import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) { }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Renouvelle le token (15 min) tant que la personne est active.
  // Un token expiré est refusé par JwtAuthGuard avant d'arriver ici.
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  refresh(@Request() req: any) {
    return {
      accessToken: this.jwtService.sign({
        sub: req.user.id,
        email: req.user.email,
      }),
    };
  }

  @Get('admins')
  @UseGuards(JwtAuthGuard)
  getAdmins() {
    return this.authService.findAllAdmins();
  }

  @Post('admins')
  @UseGuards(JwtAuthGuard)
  createAdmin(@Body() body: any) {
    return this.authService.createAdmin(body);
  }

  @Delete('admins/:id')
  @UseGuards(JwtAuthGuard)
  deleteAdmin(@Param('id') id: string, @Request() req: any) {
    // JwtStrategy.validate renvoie { id, email } : on utilise donc req.user.id
    return this.authService.removeAdmin(id, req.user.id);
  }
}