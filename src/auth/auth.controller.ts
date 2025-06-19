import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        created_at: user.created_at,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.validateUser(
        loginDto.username,
        loginDto.password,
      );
  
      if (!result) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const token = await this.authService.login(result);
  
      return {
        access_token: token.access_token,
        user: {
          id: result.id,
          username: result.username,
          email: result.email,
          roles: result.roles,
        },
      };
    } catch (error) {

      console.error('Login Error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong during login');
    }
  }
}