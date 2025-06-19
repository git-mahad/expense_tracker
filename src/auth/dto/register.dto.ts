import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username cannot be longer than 20 characters' })
  username: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50, { message: 'Password cannot be longer than 50 characters' })
  password: string;
}