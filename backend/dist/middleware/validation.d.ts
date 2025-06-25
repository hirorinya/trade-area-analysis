import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
export declare const validateRequest: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const registerSchema: any;
export declare const loginSchema: any;
export declare const projectSchema: any;
export declare const locationSchema: any;
//# sourceMappingURL=validation.d.ts.map