export interface TradeArea {
    id: string;
    location_id: string;
    name: string;
    area_type: 'drive_time' | 'distance' | 'custom';
    parameters: Record<string, any>;
    geometry?: any;
    demographics_data?: Record<string, any>;
    created_at: string;
}
export interface CreateTradeAreaRequest {
    location_id: string;
    name: string;
    area_type: 'drive_time' | 'distance' | 'custom';
    parameters: Record<string, any>;
    geometry?: any;
    demographics_data?: Record<string, any>;
}
export interface UpdateTradeAreaRequest {
    name?: string;
    area_type?: 'drive_time' | 'distance' | 'custom';
    parameters?: Record<string, any>;
    geometry?: any;
    demographics_data?: Record<string, any>;
}
export declare class TradeAreaModel {
    static create(tradeAreaData: CreateTradeAreaRequest): Promise<TradeArea>;
    static findByLocationId(locationId: string): Promise<TradeArea[]>;
    static findByProjectId(projectId: string): Promise<TradeArea[]>;
    static findById(id: string): Promise<TradeArea | null>;
    static update(id: string, updates: UpdateTradeAreaRequest): Promise<TradeArea | null>;
    static delete(id: string): Promise<boolean>;
    static validateLocationOwnership(locationId: string, userId: string): Promise<boolean>;
}
//# sourceMappingURL=TradeArea.d.ts.map