// src/services/notification_service.ts
import admin from 'firebase-admin';
import User from '../modules/users/user_models.js'; // Corrige la ruta al modelo User

// Asume que ya has inicializado firebase-admin en otra parte de tu app
// admin.initializeApp({ ... });

/**
 * Envía una notificación push a un usuario específico.
 * @param userId - El ID del usuario que recibirá la notificación.
 * @param title - El título de la notificación.
 * @param body - El cuerpo del mensaje de la notificación.
 * @param data - Un objeto con datos adicionales para que la app sepa qué hacer (ej. a qué pantalla navegar).
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data: { [key: string]: string } = {}
) => {
  try {
    // Buscamos al usuario y su token en la base de datos
    const user = await User.findById(userId).select('fcmToken name').lean();

    if (!user || !user.fcmToken) {
      console.log(`❌ Usuario ${userId} no encontrado o sin token FCM. No se envía notificación.`);
      return { success: false, reason: 'NO_TOKEN' };
    }

    const message = {
      notification: { title, body },
      data: data,
      token: user.fcmToken.trim(), // Limpiamos el token por si acaso
    };

    await admin.messaging().send(message);
    console.log(`✅ Notificación enviada con éxito a ${user.name}`);
    return { success: true };

  } catch (error: any) {
    console.error(`💥 Error al enviar notificación a ${userId}:`, error.message);

    if (error.code === 'messaging/registration-token-not-registered') {
      console.log(`🗑️ Token inválido para el usuario ${userId}. Borrando de la base de datos...`);
      await User.findByIdAndUpdate(userId, { $set: { fcmToken: null } });
      return { success: false, reason: 'TOKEN_INVALID' };
    }

    if (error.code === 'messaging/invalid-registration-token') {
      console.log(`🗑️ Token malformado para el usuario ${userId}. Borrando de la base de datos...`);
      await User.findByIdAndUpdate(userId, { $set: { fcmToken: null } });
      return { success: false, reason: 'TOKEN_MALFORMED' };
    }

    return { success: false, reason: 'UNKNOWN_ERROR', error: error.message };
  }
};

// Función adicional para limpiar tokens inválidos masivamente
export const cleanupInvalidTokens = async () => {
  try {
    const usersWithTokens = await User.find({ fcmToken: { $ne: null } }).select('_id fcmToken name');
    
    console.log(`🧹 Limpiando ${usersWithTokens.length} tokens FCM...`);
    
    for (const user of usersWithTokens) {
      try {
        // Intentamos validar el token enviando un mensaje de prueba
        await admin.messaging().send({
          token: user.fcmToken,
          data: { test: 'validation' },
          // Sin notification para que sea silencioso
        });
        console.log(`✅ Token válido para ${user.name}`);
      } catch (error: any) {
        if (error.code === 'messaging/registration-token-not-registered' || 
            error.code === 'messaging/invalid-registration-token') {
          console.log(`🗑️ Borrando token inválido para ${user.name}`);
          await User.findByIdAndUpdate(user._id, { $set: { fcmToken: null } });
        }
      }
    }
  } catch (error) {
    console.error('Error en cleanup de tokens:', error);
  }
};