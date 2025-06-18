import { IsNotEmpty, isString, IsString, MinLength } from "class-validator";

export class Login{
  @IsString()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsNotEmpty()
  @MinLength(3, {message: 'password must be at least 3 characters'})
  password: string
}