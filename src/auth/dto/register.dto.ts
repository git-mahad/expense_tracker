import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto{
  @IsString()
  @IsNotEmpty()
  @MinLength(3, {message: 'name must contain at least 3 character'})
  @MaxLength(20, {message: 'name should be within 20 character'})
  username: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  @MinLength(3, {message: 'password must contain at least 3 characters'})
  @MaxLength(15, {message: 'password must be smaller than 15 characters'})
  password: string  
}