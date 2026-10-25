import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() request: AuthenticatedRequest) {
    return this.authService.logout(request.user.id);
  }
}
