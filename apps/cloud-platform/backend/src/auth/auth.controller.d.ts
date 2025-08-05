import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            name: string | null;
            company: string | null;
            id: string;
            role: string;
            createdAt: Date;
        };
    }>;
    login(loginUserDto: LoginUserDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            company: string | null;
            role: string;
            createdAt: Date;
        };
    }>;
    refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<{
        email: string;
        name: string | null;
        company: string | null;
        id: string;
        role: string;
        createdAt: Date;
    }>;
}
