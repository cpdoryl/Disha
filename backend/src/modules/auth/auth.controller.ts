import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, LoginResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('api/v2/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const decoded = await this.authService.verifyToken(refreshTokenDto.refreshToken);
    return this.authService.refreshTokens(refreshTokenDto.refreshToken, decoded.sub);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logged out successfully' };
  }
}
