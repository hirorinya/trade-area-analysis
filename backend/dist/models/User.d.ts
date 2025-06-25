import { User, RegisterRequest } from '../types';
export declare class UserModel {
    static create(userData: RegisterRequest): Promise<User>;
    static findByEmail(email: string): Promise<User | null>;
    static findById(id: string): Promise<User | null>;
    static validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    static updateProfile(id: string, updates: Partial<User>): Promise<User | null>;
}
//# sourceMappingURL=User.d.ts.map