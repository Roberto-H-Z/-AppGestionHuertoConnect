/**
 * Static data for crops and garden areas.
 * Acts as local mock data until API is implemented.
 */

import { GardenArea, HarvestStatus } from '../types/cropTypes';

/** Default garden areas (includes one from onboarding) */
export const defaultGardenAreas: GardenArea[] = [
    {
        id: 'area-1',
        name: 'Huerto Principal',
        length: 10,
        width: 5,
    },
];

/** Available harvest status options for the add crop form */
export const harvestStatusOptions: HarvestStatus[] = [
    'Germinación',
    'Crecimiento',
    'Floración',
    'Fructificación',
    'Cosecha',
];

/** Default total days per harvest status */
export const harvestDaysMap: Record<HarvestStatus, number> = {
    'Germinación': 30,
    'Crecimiento': 60,
    'Floración': 75,
    'Fructificación': 90,
    'Cosecha': 120,
};

/** Default tasks available when creating a crop */
export const defaultCropTasks: string[] = [
    'Riego',
    'Fertilizar',
    'Podar',
    'Control de plagas',
    'Deshierbar',
    'Abonar',
    'Trasplantar',
    'Cosechar',
];

/** Watering frequency options (in days) */
export const wateringFrequencyOptions = [
    { label: 'Diario', days: 1 },
    { label: 'Cada 2 días', days: 2 },
    { label: 'Cada 3 días', days: 3 },
    { label: 'Semanal', days: 7 },
    { label: 'Quincenal', days: 15 },
];

/** Simple ID generator */
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
