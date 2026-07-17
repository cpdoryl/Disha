import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, LoginResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import {
  AUTH_LOGIN_RATE_LIMIT,
  AUTH_REFRESH_RATE_LIMIT,
  getRateLimitConfig,
} from 'src/common/config/rate-limits.config';

@ApiTags('Auth')
@Controller('api/v2/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit(getRateLimitConfig(AUTH_LOGIN_RATE_LIMIT))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @RateLimit(getRateLimitConfig(AUTH_REFRESH_RATE_LIMIT))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'New tokens generated',
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Too many refresh requests' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const decoded = await this.authService.verifyToken(refreshTokenDto.refreshToken);
    return this.authService.refreshTokens(refreshTokenDto.refreshToken, decoded.sub);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidate current session',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
  })
  logout() {
    return { message: 'Logged out successfully' };
  }
}
