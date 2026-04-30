export interface AuthResponse {
    token: string;
    refreshToken: string;
}

export interface AuthUser {
    userId: string;
    email: string;
    role: string;
}
