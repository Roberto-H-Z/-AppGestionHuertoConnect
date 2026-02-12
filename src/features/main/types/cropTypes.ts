/**
 * Types for Crop Management
 * Used across HomeScreen, AddCropModal, CropCard, and WateringModal components
 */

export interface GardenArea {
    id: string;
    name: string;
    length: number;
    width: number;
}

export interface CropTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface WateringSchedule {
    nextDate: string;       // ISO date string (YYYY-MM-DD)
    frequency: number;      // days between waterings
    quantity: number;        // liters
    lastWatering: string;   // display text, e.g. "Ayer 7:00 AM"
}

export interface Crop {
    id: string;
    gardenAreaId: string;
    name: string;
    imageUri: string | null;
    currentDay: number;
    totalDays: number;
    harvestStatus: string;
    nextWatering: string;
    watering: WateringSchedule;
    tasks: CropTask[];
    description: string;
}

export type HarvestStatus = 'Germinación' | 'Crecimiento' | 'Floración' | 'Fructificación' | 'Cosecha';
