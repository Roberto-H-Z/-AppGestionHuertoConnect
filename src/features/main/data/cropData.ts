/**
 * Static data and utilities for the main feature.
 * Constants used by various components.
 */

/** Simple ID generator (used for local UI state only) */
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
