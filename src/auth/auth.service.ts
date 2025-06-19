import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto): Promise<User> {
    const { username, email, password } = registerDto;

    const existingUserByUsername = await this.userService.findByUsername(username);
    const existingUserByEmail = await this.userService.findByEmail(email);

    if (existingUserByUsername || existingUserByEmail) {
      throw new ConflictException('Username or email already exists');
    }
    const user = await this.userService.create({
      username,
      email,
      password,
    });

    return user;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userService.findByUsername(username);

    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }

    return null;
  }

  async login(user: User) {
    const payload = {
      username: user.username,
      sub: user.id,
      roles: user.roles?.map(role => role.name) || [],
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      return await this.userService.findById(payload.sub);
    } catch (error) {
      return null;
    }
  }
  // async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
  //   const { currentPassword, newPassword } = changePasswordDto;

  //   const user = await this.userService.findById(userId);
  //   if (!user) {
  //     throw new UnauthorizedException('User not found');
  //   }

  //   const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  //   if (!isCurrentPasswordValid) {
  //     throw new UnauthorizedException('Current password is incorrect');
  //   }

  //   const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  //   await this.userService.updatePassword(userId, hashedNewPassword);
  // }

  // @Post('change-password')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // async changePassword(
  //   @Request() req,
  //   @Body() changePasswordDto: ChangePasswordDto
  // ) {
  //   await this.authService.changePassword(req.user.id, changePasswordDto);
  //   return { message: 'Password changed successfully' };
  // }

  // @Post('logout')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // async logout(@Request() req) {
  //   const token = req.headers.authorization?.replace('Bearer ', '');
  //   await this.authService.logout(token);
  //   return { message: 'Logged out successfully' };
  // }

}