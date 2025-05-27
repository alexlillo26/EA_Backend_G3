// src/modules/chat/chat_controller.ts
import { Response } from 'express';
// Importa RequestExt desde tu archivo de middleware/session
import { RequestExt } from '../../middleware/session.js'; // Ajusta esta ruta si es necesario
import * as chatService from './chat_service.js';
import mongoose from 'mongoose';

export const initiateConversationHandler = async (req: RequestExt, res: Response) => {
  try {
    // Ahora req.user.id y req.user.name están correctamente tipados según RequestExt
    const currentUserId = req.user?.id; 
    const { opponentId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ message: 'No autenticado. Falta el ID del usuario actual en la petición.' });
    }
    if (!opponentId) {
      return res.status(400).json({ message: 'El campo "opponentId" es requerido en el cuerpo de la petición.' });
    }

    const conversationId = await chatService.initiateOrGetConversation(currentUserId, opponentId);
    res.status(200).json({ conversationId });

  } catch (error: any) {
    console.error('[ChatController] Error en initiateConversationHandler:', error.message);
    if (error.message.includes('no es un ObjectId válido') ||
        error.message.includes('No puedes iniciar una conversación contigo mismo') ||
        error.message.includes('El campo "opponentId" es requerido')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Usuario oponente no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud de chat.'});
  }
};

export const getMyConversationsHandler = async (req: RequestExt, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const validLimits = [10, 20, 50];
    if (!validLimits.includes(limit)) {
        return res.status(400).json({ message: `El límite de elementos por página debe ser uno de: ${validLimits.join(', ')}` });
    }

    const result = await chatService.getConversationsForUser(currentUserId, page, limit);
    res.status(200).json(result);

  } catch (error: any) {
    console.error('[ChatController] Error en getMyConversationsHandler:', error.message);
    if (error.message.includes('El ID de usuario no es válido')) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error interno del servidor al obtener las conversaciones.'});
  }
};

export const getConversationMessagesHandler = async (req: RequestExt, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const { conversationId } = req.params;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const validLimits = [15, 30, 50, 100];
    if (!validLimits.includes(limit)) {
        return res.status(400).json({ message: `El límite de mensajes por página debe ser uno de: ${validLimits.join(', ')}` });
    }

    if (!currentUserId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId) ) {
      return res.status(400).json({ message: 'El ID de la conversación es requerido y debe ser válido.'});
    }

    const result = await chatService.getMessagesForConversation(conversationId, currentUserId, page, limit);
    res.status(200).json(result);

  } catch (error: any) {
    console.error('[ChatController] Error en getConversationMessagesHandler:', error.message);
    if (error.message.includes('no es válido')) {
        return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('No tienes permiso')) {
        return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('Conversación no encontrada')) {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error interno del servidor al obtener los mensajes.'});
  }
};