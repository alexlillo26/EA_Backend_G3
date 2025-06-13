// src/modules/combats/combat_models.ts
import mongoose, { Types, model, Schema, Document } from "mongoose";

// Tu interfaz ICombat existente
export interface ICombat extends Document {
    _id: Types.ObjectId;
    creator: Types.ObjectId;
    opponent: Types.ObjectId;
    date: Date;
    time: string;
    level: string;
    gym: Types.ObjectId;
    // --- MODIFICACIÓN AQUÍ ---
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'active' | 'cancelled'; // Añadidos 'completed', 'active', 'cancelled'
    winner?: Types.ObjectId | null; // --- NUEVO CAMPO AQUÍ --- (ID del User ganador, null para empate o no definido)
    // --- FIN MODIFICACIÓN ---
    createdAt?: Date;
    updatedAt?: Date;
    image?: string;
    cancellationReason?: string; // <-- AÑADIR ESTA LÍNEA

}

const combatSchema = new Schema<ICombat>({
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    opponent: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    gym: {
        type: Schema.Types.ObjectId,
        ref: "Gym",
        required: true
    },
    // --- MODIFICACIÓN AQUÍ ---
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'active', 'cancelled'], // Estados actualizados
        default: 'pending',
        required: true
    },
    image: {
        type: String
    },
    winner: { // --- NUEVO CAMPO AQUÍ ---
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    cancellationReason: { type: String } // <-- AÑADIR ESTA LÍNEA
    // --- FIN MODIFICACIÓN ---
}, { timestamps: true });

// Índices (opcional, pero recomendado para el nuevo query)
combatSchema.index({ creator: 1, status: 1, date: -1 });
combatSchema.index({ opponent: 1, status: 1, date: -1 });

const CombatModel = model<ICombat>('Combat', combatSchema); // Usando CombatModel como en mi sugerencia anterior
export default CombatModel; // o export default model<ICombat>('Combat', combatSchema); si prefieres Combat directamente