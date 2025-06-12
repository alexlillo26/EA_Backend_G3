// src/modules/combats/combat_models.ts
import { model, Schema } from "mongoose";
const combatSchema = new Schema({
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
    winner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
    // --- FIN MODIFICACIÓN ---
}, { timestamps: true });
// Índices (opcional, pero recomendado para el nuevo query)
combatSchema.index({ creator: 1, status: 1, date: -1 });
combatSchema.index({ opponent: 1, status: 1, date: -1 });
const CombatModel = model('Combat', combatSchema); // Usando CombatModel como en mi sugerencia anterior
export default CombatModel; // o export default model<ICombat>('Combat', combatSchema); si prefieres Combat directamente
