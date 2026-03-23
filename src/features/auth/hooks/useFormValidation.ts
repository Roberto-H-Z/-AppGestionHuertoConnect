import { useState, useCallback } from 'react';

// ── Types ──
export type ValidationStatus = 'idle' | 'valid' | 'error';

export interface FieldValidation {
    status: ValidationStatus;
    message: string;
}

export interface FieldErrors {
    [key: string]: FieldValidation;
}

// ── Regex patterns ──
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

// ── Password strength ──
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) score++;
    // Map 0-5 → 0-4
    if (score <= 1) return 0;
    if (score === 2) return 1;
    if (score === 3) return 2;
    if (score === 4) return 3;
    return 4;
};

export const getStrengthLabel = (strength: PasswordStrength): string => {
    switch (strength) {
        case 0: return 'Muy débil';
        case 1: return 'Débil';
        case 2: return 'Regular';
        case 3: return 'Fuerte';
        case 4: return 'Muy fuerte';
    }
};

export const getStrengthColor = (strength: PasswordStrength): string => {
    switch (strength) {
        case 0: return '#ff4757';
        case 1: return '#ff6b6b';
        case 2: return '#ffa502';
        case 3: return '#2ed573';
        case 4: return '#6ee7b7';
    }
};

// ── Validation rules ──

const IDLE: FieldValidation = { status: 'idle', message: '' };
const valid = (msg: string): FieldValidation => ({ status: 'valid', message: msg });
const error = (msg: string): FieldValidation => ({ status: 'error', message: msg });

export function validateField(
    name: string,
    value: string,
    extra?: { password?: string }
): FieldValidation {
    const v = value.trim();

    switch (name) {
        // ── Email ──
        case 'email': {
            if (!v) return error('El correo electrónico es obligatorio');
            if (!EMAIL_REGEX.test(v)) return error('Ingresa un correo válido (ej. usuario@dominio.com)');
            return valid('Correo válido');
        }

        // ── Password ──
        case 'password': {
            if (!v) return error('La contraseña es obligatoria');
            if (v.length < 8) return error(`Mínimo 8 caracteres (faltan ${8 - v.length})`);
            if (!/[A-Z]/.test(v)) return error('Debe incluir al menos una mayúscula');
            if (!/[a-z]/.test(v)) return error('Debe incluir al menos una minúscula');
            if (!/\d/.test(v)) return error('Debe incluir al menos un número');
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(v))
                return error('Debe incluir al menos un carácter especial (!@#$...)');
            return valid('Contraseña segura');
        }

        // ── Confirm password ──
        case 'confirmPassword': {
            if (!v) return error('Confirma tu contraseña');
            if (extra?.password && v !== extra.password)
                return error('Las contraseñas no coinciden');
            if (extra?.password && v === extra.password)
                return valid('Las contraseñas coinciden ✓');
            return IDLE;
        }

        // ── Nombre ──
        case 'nombre': {
            if (!v) return error('El nombre es obligatorio');
            if (v.length < 2) return error('Mínimo 2 caracteres');
            if (v.length > 50) return error('Máximo 50 caracteres');
            if (!NAME_REGEX.test(v)) return error('Solo se permiten letras y espacios');
            return valid('Nombre válido');
        }

        // ── Apellidos ──
        case 'apellidos': {
            if (!v) return error('Los apellidos son obligatorios');
            if (v.length < 2) return error('Mínimo 2 caracteres');
            if (v.length > 80) return error('Máximo 80 caracteres');
            if (!NAME_REGEX.test(v)) return error('Solo se permiten letras y espacios');
            return valid('Apellidos válidos');
        }

        // ── Login-only password (less strict) ──
        case 'loginPassword': {
            if (!v) return error('La contraseña es obligatoria');
            if (v.length < 6) return error('Mínimo 6 caracteres');
            return valid('');
        }

        default:
            return IDLE;
    }
}

// ── Hook ──
export function useFormValidation() {
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleValidateField = useCallback(
        (name: string, value: string, extra?: { password?: string }) => {
            const result = validateField(name, value, extra);
            setFieldErrors((prev) => ({ ...prev, [name]: result }));
            return result;
        },
        []
    );

    const markTouched = useCallback((name: string) => {
        setTouched((prev) => ({ ...prev, [name]: true }));
    }, []);

    const getFieldStatus = useCallback(
        (name: string): FieldValidation => {
            return fieldErrors[name] || IDLE;
        },
        [fieldErrors]
    );

    const isTouched = useCallback(
        (name: string): boolean => {
            return !!touched[name];
        },
        [touched]
    );

    const validateAllFields = useCallback(
        (
            fields: { name: string; value: string; extra?: { password?: string } }[]
        ): boolean => {
            let allValid = true;
            const newErrors: FieldErrors = {};
            const newTouched: Record<string, boolean> = {};

            for (const { name, value, extra } of fields) {
                const result = validateField(name, value, extra);
                newErrors[name] = result;
                newTouched[name] = true;
                if (result.status === 'error') allValid = false;
            }

            setFieldErrors((prev) => ({ ...prev, ...newErrors }));
            setTouched((prev) => ({ ...prev, ...newTouched }));
            return allValid;
        },
        []
    );

    const resetValidation = useCallback(() => {
        setFieldErrors({});
        setTouched({});
    }, []);

    return {
        fieldErrors,
        handleValidateField,
        markTouched,
        getFieldStatus,
        isTouched,
        validateAllFields,
        resetValidation,
    };
}
