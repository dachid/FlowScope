export declare class CreateUserDto {
    email: string;
    password: string;
    name: string;
    company?: string;
}
export declare class LoginUserDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class AuthResponseDto {
    user: {
        id: string;
        email: string;
        name: string;
        company?: string;
        role: string;
        createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
}
