import { Location } from '../types';
export interface CreateLocationRequest {
    project_id: string;
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    location_type: 'store' | 'competitor' | 'poi';
    metadata?: Record<string, any>;
}
export interface UpdateLocationRequest {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    location_type?: 'store' | 'competitor' | 'poi';
    metadata?: Record<string, any>;
}
export declare class LocationModel {
    static create(userId: string, locationData: CreateLocationRequest): Promise<Location>;
    static findByProjectId(projectId: string, userId: string): Promise<Location[]>;
    static findById(id: string, userId: string): Promise<Location | null>;
    static update(id: string, userId: string, updates: UpdateLocationRequest): Promise<Location | null>;
    static delete(id: string, userId: string): Promise<boolean>;
    static findNearby(latitude: number, longitude: number, radiusKm: number, userId: string): Promise<Location[]>;
}
//# sourceMappingURL=Location.d.ts.map