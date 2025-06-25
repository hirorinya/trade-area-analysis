import { JWTPayload } from '../types';
export declare const generateTokens: (payload: JWTPayload) => {
    accessToken: string;
    refreshToken: string;
};
export declare const verifyToken: (token: string) => JWTPayload;
export declare const decodeToken: (token: string) => JWTPayload | null;
//# sourceMappingURL=jwt.d.ts.map