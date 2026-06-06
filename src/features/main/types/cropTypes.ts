/**
 * Types for Huerto Management
 * Matches the production API schemas (HuertoResponse, RegionResponse,
 * CultivoResponse, HuertoCultivoResponse).
 */

// ── API Response Types ──────────────────────────────────────────

/** Matches RegionResponse from GET /api/regiones */
export interface Region {
    id: string;
    nombre: string;
    actividad: 'Alta' | 'Media' | 'Baja';
    priorizada: boolean;
    created_at?: string | null;
}

/** Matches HuertoResponse from GET /api/huertos */
export interface Huerto {
    id: string;
    nombre: string;
    usuario_id: string;
    municipio: string;
    region_id?: string | null;
    estado: 'Optimo' | 'Atencion' | 'Critico';
    salud: number; // 0–100
    created_at?: string | null;
}

/** Matches CultivoResponse from GET /api/cultivos */
export interface Cultivo {
    id: string;
    nombre: string;
    temporada: string;
    dificultad: 'Baja' | 'Media' | 'Alta';
    riego: string;
    fertilizacion: string;
    activo: boolean;
    created_at?: string | null;
}

/** Matches HuertoCultivoResponse from GET /api/cultivos/siembras/{huerto_id} */
export interface Siembra {
    id: string;
    huerto_id: string;
    cultivo_id: string;
    fecha_siembra?: string | null;
    estado: 'Activo' | 'Cosechado' | 'Perdido';
    created_at?: string | null;
}

// ── Create / Update Payloads ────────────────────────────────────

export interface HuertoCreate {
    nombre: string;
    municipio?: string;
    region_id?: string | null;
    estado?: 'Optimo' | 'Atencion' | 'Critico';
    salud?: number;
}

export interface HuertoUpdate {
    nombre?: string | null;
    municipio?: string | null;
    region_id?: string | null;
    estado?: string | null;
    salud?: number | null;
}

export interface RegionCreate {
    nombre: string;
    actividad?: 'Alta' | 'Media' | 'Baja';
    priorizada?: boolean;
}

export interface CultivoCreate {
    nombre: string;
    temporada?: string;
    dificultad?: 'Baja' | 'Media' | 'Alta';
    riego?: string;
    fertilizacion?: string;
    activo?: boolean;
}

export interface SiembraCreate {
    huerto_id: string;
    cultivo_id: string;
    fecha_siembra?: string | null;
    estado?: 'Activo' | 'Cosechado' | 'Perdido';
}

export interface RecomendarCultivosRequest {
    lat: number;
    lon: number;
    municipio?: string | null;
    huerto_id?: string | null;
}

export interface ClimaRecomendacion {
    temp_max: number;
    temp_min: number;
    temp_actual: number;
    humedad: number;
    descripcion: string;
    ciudad: string;
    fuente: string;
}

export interface RecomendacionCultivo {
    cultivo: string;
    confianza: number;
    justificacion: string;
    temporada_ideal: string;
    rango_temperatura: string;
    tecnica_riego: string;
    notas_veracruz: string;
}

export interface RecomendarCultivosResponse {
    clima: ClimaRecomendacion;
    recomendaciones: RecomendacionCultivo[];
    modelo_version: string;
    modo: string;
}

// ── Enriched UI Models ──────────────────────────────────────────

/** A siembra enriched with the full Cultivo object for display */
export interface SiembraConCultivo extends Siembra {
    cultivo?: Cultivo;
}

/** A Huerto enriched with its Region and Siembras for display in cards */
export interface HuertoConDetalles {
    huerto: Huerto;
    region?: Region;
    siembras: SiembraConCultivo[];
}

// ── Constants ───────────────────────────────────────────────────

export const ESTADO_HUERTO_OPTIONS: Huerto['estado'][] = ['Optimo', 'Atencion', 'Critico'];
export const ACTIVIDAD_REGION_OPTIONS: Region['actividad'][] = ['Alta', 'Media', 'Baja'];
export const DIFICULTAD_CULTIVO_OPTIONS: Cultivo['dificultad'][] = ['Baja', 'Media', 'Alta'];
export const ESTADO_SIEMBRA_OPTIONS: Siembra['estado'][] = ['Activo', 'Cosechado', 'Perdido'];

export const ESTADO_COLORS: Record<Huerto['estado'], { bg: string; text: string; bar: string }> = {
    Optimo:   { bg: '#E8F5E9', text: '#2E7D32', bar: '#4CAF50' },
    Atencion: { bg: '#FFF8E1', text: '#F57F17', bar: '#FFC107' },
    Critico:  { bg: '#FFEBEE', text: '#C62828', bar: '#EF5350' },
};
