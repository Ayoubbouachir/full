import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegisterFaceDto } from './dto/register-face.dto';
import { LoginFaceDto } from './dto/login-face.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('register-face')
  registerFace(@Body() registerFaceDto: RegisterFaceDto) {
    return this.authService.registerFace(registerFaceDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login-face')
  loginFace(@Body() loginFaceDto: LoginFaceDto) {
    return this.authService.loginFace(loginFaceDto);
  }
}
