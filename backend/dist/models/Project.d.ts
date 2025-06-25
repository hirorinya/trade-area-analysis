import { Project } from '../types';
export interface CreateProjectRequest {
    name: string;
    description?: string;
    settings?: Record<string, any>;
}
export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    settings?: Record<string, any>;
}
export declare class ProjectModel {
    static create(userId: string, projectData: CreateProjectRequest): Promise<Project>;
    static findByUserId(userId: string): Promise<Project[]>;
    static findById(id: string, userId: string): Promise<Project | null>;
    static update(id: string, userId: string, updates: UpdateProjectRequest): Promise<Project | null>;
    static delete(id: string, userId: string): Promise<boolean>;
    static getProjectStats(projectId: string, userId: string): Promise<any>;
}
//# sourceMappingURL=Project.d.ts.map