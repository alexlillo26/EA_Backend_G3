// src/modules/chat/chat_service.ts
import mongoose, { Types } from 'mongoose';
import { Conversation, IConversation, ChatMessage, IChatMessage } from './chat_models.js';
import User, { IUser } from '../users/user_models.js';

// ... initiateOrGetConversation y addMessageToConversation (sin cambios) ...
export const initiateOrGetConversation = async (currentUserId: string, opponentId: string): Promise<string> => {
  if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
    throw new Error(`El ID del usuario actual '${currentUserId}' no es un ObjectId válido.`);
  }
  if (!mongoose.Types.ObjectId.isValid(opponentId)) {
    throw new Error(`El ID del oponente '${opponentId}' no es un ObjectId válido.`);
  }

  if (currentUserId === opponentId) {
    throw new Error('No puedes iniciar una conversación contigo mismo.');
  }

  const opponentUser = await User.findById(opponentId);
  if (!opponentUser) {
    throw new Error(`Usuario oponente con ID '${opponentId}' no encontrado.`);
  }

  const participantsObjectIds = [
    new Types.ObjectId(currentUserId),
    new Types.ObjectId(opponentId),
  ];

  participantsObjectIds.sort((idA, idB) => idA.toString().localeCompare(idB.toString()));

  let conversation: IConversation | null = await Conversation.findOne({
    participants: {
      $all: participantsObjectIds,
      $size: 2,
    },
  });

  if (conversation) {
    return (conversation._id as Types.ObjectId | string).toString();
  } else {
    const newConversationData: Partial<IConversation> = {
      participants: participantsObjectIds,
    };
    const newConversation = new Conversation(newConversationData);
    await newConversation.save();
    return (newConversation._id as Types.ObjectId | string).toString();
  }
};

export const addMessageToConversation = async (
  conversationId: string,
  senderId: string,
  senderUsername: string,
  messageText: string
): Promise<IChatMessage> => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new Error('El ID de la conversación no es válido.');
  }
  if (!mongoose.Types.ObjectId.isValid(senderId)) {
    throw new Error('El ID del remitente no es válido.');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversación no encontrada.');
  }

  if (!conversation.participants.map(p => p.toString()).includes(senderId)) {
      throw new Error('El remitente no es participante de esta conversación.');
  }

  const newMessage = new ChatMessage({
    conversationId: new Types.ObjectId(conversationId),
    senderId: new Types.ObjectId(senderId),
    senderUsername: senderUsername,
    message: messageText,
  });

  const savedMessage = await newMessage.save();

  conversation.lastMessage = savedMessage._id as Types.ObjectId;
  conversation.updatedAt = new Date();
  await conversation.save();

  return savedMessage;
};


export interface PopulatedConversationPreview {
  _id: string;
  otherParticipant: {
    _id: string;
    name: string;
    profilePicture?: string;
  } | null;
  lastMessage?: {
    _id: string;
    message: string;
    senderId: string;
    senderUsername: string;
    createdAt: Date;
  };
  updatedAt: Date;
  unreadCount: number;
}

export const getConversationsForUser = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ conversations: PopulatedConversationPreview[], totalConversations: number, totalPages: number, currentPage: number }> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('El ID de usuario no es válido.');
  }

  const skip = (page - 1) * limit;
  const userObjectId = new Types.ObjectId(userId);

  const totalConversations = await Conversation.countDocuments({ participants: userObjectId });
  const totalPages = Math.ceil(totalConversations / limit);

  const conversationsFromDB = await Conversation.find({ participants: userObjectId })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate<{ lastMessage: IChatMessage | null }>('lastMessage', 'message senderId senderUsername createdAt')
    .populate<{ participants: IUser[] }>('participants', 'name profilePicture email') // Popula todos los participantes
    .lean() // Importante para trabajar con objetos planos
    .exec();

  const formattedConversations: PopulatedConversationPreview[] = conversationsFromDB.map(conv => {
    // Forzamos el tipo para que TypeScript reconozca _id
    const participants = conv.participants as (IUser & { _id: Types.ObjectId | string })[];
    // Encuentra al otro participante
    const otherParticipantDoc = participants.find(p => p._id.toString() !== userId);
    
    let otherParticipantData: PopulatedConversationPreview['otherParticipant'] = null;
    if (otherParticipantDoc) {
        otherParticipantData = {
            _id: otherParticipantDoc._id.toString(),
            name: otherParticipantDoc.name || 'Usuario Desconocido', // Fallback si el nombre es null/undefined
            profilePicture: otherParticipantDoc.profilePicture
        };
    } else {
        console.warn(`[ChatService] No se encontró otro participante para la conversación ${conv._id?.toString()}`);
    }

    let lastMessageData: PopulatedConversationPreview['lastMessage'] = undefined;
    if (conv.lastMessage && conv.lastMessage._id) { // Asegurarse que lastMessage y su _id no son null
        lastMessageData = {
            _id: (conv.lastMessage._id as Types.ObjectId | string).toString(),
            message: conv.lastMessage.message,
            senderId: (conv.lastMessage.senderId as Types.ObjectId | string).toString(),
            senderUsername: conv.lastMessage.senderUsername,
            createdAt: conv.lastMessage.createdAt
        };
    }

    return {
      _id: (conv._id as Types.ObjectId | string).toString(),
      otherParticipant: otherParticipantData,
      lastMessage: lastMessageData,
      updatedAt: conv.updatedAt as Date, // Mongoose lean() devuelve Date para timestamps
      unreadCount: 0, // Placeholder
    };
  });
  
  console.log(`[ChatService DEBUG] getConversationsForUser (No-Aggregate) for ${userId} (Page ${page}):`);
  formattedConversations.forEach((conv, index) => {
    console.log(`  Conv[${index}] ID: ${conv._id}`);
    if (conv.otherParticipant && conv.otherParticipant._id) {
      console.log(`    OtherP ID: ${conv.otherParticipant._id}, Name: '${conv.otherParticipant.name}'`);
    } else {
      console.log(`    OtherP: Datos incompletos o nulos.`);
    }
  });


  return {
    conversations: formattedConversations,
    totalConversations,
    totalPages,
    currentPage: page,
  };
};

export const getMessagesForConversation = async (
  conversationId: string,
  userId: string, // Para verificar que el usuario es participante
  page: number = 1,
  limit: number = 30 
): Promise<{ messages: IChatMessage[], totalMessages: number, totalPages: number, currentPage: number }> => {
  // ... (sin cambios, esta función no usa aggregate y no debería dar ese error de tipado)
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new Error('El ID de la conversación no es válido.');
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('El ID de usuario no es válido.');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversación no encontrada.');
  }
  if (!conversation.participants.map(p => p.toString()).includes(userId)) {
    throw new Error('No tienes permiso para ver los mensajes de esta conversación.');
  }

  const skip = (page - 1) * limit;

  const messagesQuery = ChatMessage.find({ conversationId: new Types.ObjectId(conversationId) })
    .sort({ createdAt: -1 }) 
    .skip(skip)
    .limit(limit)
    .lean();

  const [messages, totalMessages] = await Promise.all([
      messagesQuery.exec(),
      ChatMessage.countDocuments({ conversationId: new Types.ObjectId(conversationId) })
  ]);
  
  const totalPages = Math.ceil(totalMessages / limit);

  return {
    messages: messages.reverse() as IChatMessage[], 
    totalMessages,
    totalPages,
    currentPage: page,
  };
};