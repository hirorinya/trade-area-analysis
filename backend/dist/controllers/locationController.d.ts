import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const getLocationsByProject: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const findNearbyLocations: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=locationController.d.ts.map