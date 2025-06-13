import mongoose, { Types } from 'mongoose';
import Combat, { ICombat } from '../combats/combat_models.js';
import CombatModel from '../combats/combat_models.js';
import Rating from '../ratings/rating_model.js';  // <-- importa el modelo

interface CombatHistoryResult {
    combats: ICombat[];
    totalCombats: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }

export const saveMethod = () => {
    return 'Hola';
};

export const createCombat = async (combatData: Partial<ICombat>, imagePath?: string) => {
    // Validar y convertir IDs a ObjectId si son string
    if (combatData.creator && typeof combatData.creator === 'string') {
        combatData.creator = new mongoose.Types.ObjectId(combatData.creator);
    }
    if (combatData.opponent && typeof combatData.opponent === 'string') {
        combatData.opponent = new mongoose.Types.ObjectId(combatData.opponent);
    }
    if (combatData.gym && typeof combatData.gym === 'string') {
        combatData.gym = new mongoose.Types.ObjectId(combatData.gym);
    }
    if(imagePath){
        combatData.image = imagePath; 
    }
    const combat = new Combat(combatData);
    return await combat.save();
};


// Devuelve todos los combates aceptados donde el usuario es creator u opponent
export const getFutureCombats = async (userId: string, page: number = 1, pageSize: number = 10) => {
    const skip = (page - 1) * pageSize;
    const filter = {
        status: 'accepted',
        $or: [{ creator: userId }, { opponent: userId }]
    };

    const totalCombats = await Combat.countDocuments(filter);
    const totalPages = Math.ceil(totalCombats / pageSize);

    const combats = await Combat.find(filter)
        .skip(skip)
        .limit(pageSize)
        .populate('creator')
        .populate('opponent')
        .populate('gym');

    return {
        combats,
        totalCombats,
        totalPages,
        currentPage: page,
        pageSize
    };
};

export const getPendingInvitations = async (userId: string) => {
    return Combat.find({ opponent: userId, status: 'pending' })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
};

export const getSentInvitations = async (userId: string) => {
    return Combat.find({ creator: userId, status: 'pending' })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
};

export const respondToCombatInvitation = async (
    combatId: string,
    userId: string,
    status: 'accepted' | 'rejected'
) => {
    const combat = await Combat.findById(combatId);
    if (!combat) throw new Error('Combate no encontrado');
    if (combat.opponent.toString() !== userId) throw new Error('Solo el usuario invitado puede responder');
    if (status === 'accepted') {
        combat.status = 'accepted';
        await combat.save();
        return combat;
    } else if (status === 'rejected') {
        await Combat.deleteOne({ _id: combatId });
        return { deleted: true };
    } else {
        throw new Error('Estado inválido');
    }
};

export const getAllCombats = async (page: number, pageSize: number) => {
    try {
        const skip = (page - 1) * pageSize;
        const totalCombats = await Combat.countDocuments();
        const totalPages = Math.ceil(totalCombats / pageSize);
        const combats = await Combat.find().skip(skip).limit(pageSize);
        return {
            combats,
            totalCombats,
            totalPages,
            currentPage: page,
            pageSize
        };
    } catch (error) {
        console.error('Error in getAllCombats:', error);
        throw error;
    }
};

export const getCombatById = async (id: string, page: number, pageSize: number) => {
    return await Combat.findById(id)
        .populate('creator')
        .populate('opponent')
        .populate('gym');
};

export const updateCombat = async (id: string, updateData: Partial<ICombat>) => {
    return await Combat.updateOne({ _id: id }, { $set: updateData });
};

export const deleteCombat = async (id: string) => {
    return await Combat.deleteOne({ _id: id });
};

export const getBoxersByCombatId = async (id: string) => {
    const combat = await Combat.findById(id)
        .populate('creator')
        .populate('opponent');
    if (!combat) return [];
    return [
        combat.creator,
        combat.opponent
    ];
};

export const hideCombat = async (id: string, isHidden: boolean) => {
    return await Combat.updateOne({ _id: id }, { $set: { isHidden } });
};

export const getCompletedCombatHistoryForBoxer = async (
    boxerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<CombatHistoryResult> => {
    const boxerObjectId = new mongoose.Types.ObjectId(boxerId);
    const skip = (page - 1) * pageSize;
  
    const now = new Date();
    
    // === CONSULTA CORREGIDA ===
    // Para el historial queremos combates que YA han ocurrido:
    // 1. Combates con status 'completed' (finalizados con resultado)
    // 2. Combates con status 'accepted' que ya pasaron su fecha (ocurrieron pero sin resultado registrado)
    // 3. Combates 'cancelled' y 'rejected' para mostrar historial completo
    const query = {
      $or: [
        { creator: boxerObjectId },
        { opponent: boxerObjectId },
      ],
      $and: [
        {
          $or: [
            // Combates completados (con resultado)
            { status: 'completed' },
            // Combates aceptados que ya pasaron su fecha
            { 
              status: 'accepted', 
              date: { $lt: now } // Cambié $lte por $lt para asegurar que ya pasó
            }
          ]
        }
      ]
    };
    // === FIN DE LA CORRECCIÓN ===
  
    const totalCombats = await CombatModel.countDocuments(query);
    const totalPages = Math.ceil(totalCombats / pageSize);
  
    interface PopulatedUserRef { _id: Types.ObjectId; name: string; profileImage?: string; }
    interface PopulatedGymRef { _id: Types.ObjectId; name: string; location?: string; }
  
    const combats = await CombatModel.find(query)
      .populate<{ creator: PopulatedUserRef }>('creator', '_id name profileImage')
      .populate<{ opponent: PopulatedUserRef }>('opponent', '_id name profileImage')
      .populate<{ winner?: PopulatedUserRef | null }>('winner', 'name')
      .populate<{ gym: PopulatedGymRef }>('gym', 'name location')
      .sort({ date: -1, time: -1 }) // Más recientes primero
      .skip(skip)
      .limit(pageSize)
      .lean<ICombat[]>();
  
    return {
      combats,
      totalCombats,
      totalPages,
      currentPage: page,
      pageSize,
    };
  };

export const setCombatResult = async (combatId: string, winnerId: string) => {
    const combat = await Combat.findById(combatId);
  
    if (!combat) {
      throw new Error('Combate no encontrado');
    }

    if (combat.winner) {
      throw new Error('Este combate ya tiene un resultado asignado.');
    }
    
    const isWinnerParticipant = [combat.creator.toString(), combat.opponent.toString()].includes(winnerId);
    if (!isWinnerParticipant) {
      throw new Error('El ganador debe ser uno de los participantes del combate.');
    }
  
    combat.status = 'completed';
    combat.winner = new mongoose.Types.ObjectId(winnerId);
  
    await combat.save();
    return combat.populate(['creator', 'opponent', 'gym', 'winner']);
  };

  export const updateCombatImage = async (combatId: string, imagePath: string) => {
    // Asegura que la ruta se guarde con barras normales para la web
    const normalizedPath = imagePath.replace(/\\/g, '/');
    return await Combat.findByIdAndUpdate(
        combatId,
        { $set: { image: normalizedPath } },
        { new: true }
    );
};

export const generateUserStatistics = async (boxerId: string): Promise<object> => {
  const boxerObjectId = new mongoose.Types.ObjectId(boxerId);
  const now = new Date();

  const matchStage = {
    $match: {
      $and: [
        {
          $or: [
            { status: 'completed' },
            { status: 'accepted', date: { $lte: now } }
          ]
        },
        {
          $or: [
            { creator: boxerObjectId },
            { opponent: boxerObjectId }
          ]
        }
      ]
    }
  };

  // 1. Oponente más frecuente
  const opponentAggregation = await Combat.aggregate([
    matchStage,
    {
      $project: {
        actualOpponent: {
          $cond: {
            if: { $eq: ['$creator', boxerObjectId] },
            then: '$opponent',
            else: '$creator'
          }
        }
      }
    },
    { $group: { _id: '$actualOpponent', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'opponentDetails'
      }
    },
    { $unwind: '$opponentDetails' },
    {
      $project: {
        _id: 0,
        opponent: {
          id: '$opponentDetails._id',
          name: '$opponentDetails.name'
        },
        count: '$count'
      }
    }
  ]);

  // 2. Gimnasios más frecuentes
  const frequentGyms = await Combat.aggregate([
    matchStage,
    { $group: { _id: '$gym', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'gyms',
        localField: '_id',
        foreignField: '_id',
        as: 'gymDetails'
      }
    },
    { $unwind: '$gymDetails' },
    {
      $project: {
        _id: 0,
        gym: {
          id: '$gymDetails._id',
          name: '$gymDetails.name'
        },
        count: '$count'
      }
    }
  ]);

  // 3. Combates por mes
  const combatsPerMonth = await Combat.aggregate([
    matchStage,
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        count: '$count'
      }
    }
  ]);

  // 4. Promedios de valoraciones recibidas
  const ratingAgg = await Rating.aggregate([
    { $match: { to: boxerObjectId } },
    {
      $group: {
        _id: null,
        punctualityAvg:   { $avg: '$punctuality' },
        attitudeAvg:      { $avg: '$attitude' },
        intensityAvg:     { $avg: '$intensity' },
        sportmanshipAvg:  { $avg: '$sportmanship' },
        techniqueAvg:     { $avg: '$technique' }
      }
    },
    {
      $project: {
        _id: 0,
        punctuality:  { $round: ['$punctualityAvg', 2] },
        attitude:     { $round: ['$attitudeAvg', 2] },
        intensity:    { $round: ['$intensityAvg', 2] },
        sportmanship: { $round: ['$sportmanshipAvg', 2] },
        technique:    { $round: ['$techniqueAvg', 2] }
      }
    }
  ]);

  const ratingAverages = ratingAgg[0] || {
    punctuality: 0,
    attitude: 0,
    intensity: 0,
    sportmanship: 0,
    technique: 0
  };

  return {
    mostFrequentOpponent: opponentAggregation[0] || null,
    frequentGyms,
    combatsPerMonth,
    ratingAverages
  };
};

  export const getCombatsByGymId = async (gymId: string, page: number, pageSize: number) => {
    const combats = await Combat.find({ gym: gymId })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('creator')
      .populate('opponent')
      .populate('gym');

    const total = await Combat.countDocuments({ gym: gymId });
    const totalPages = Math.ceil(total / pageSize);

    return {
      combats,
      totalPages,
      currentPage: page,
    };
  };
