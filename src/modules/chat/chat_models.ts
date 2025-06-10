// src/modules/chat/chat_models.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

// Interfaz para el documento de Conversación en TypeScript
export interface IConversation extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId; // Referencia al ObjectId del último ChatMessage
  // createdAt y updatedAt son añadidos automáticamente por Mongoose (timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para el documento de Mensaje de Chat en TypeScript
export interface IChatMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderUsername: string;
  message: string;
  readBy: Types.ObjectId[];
  // createdAt y updatedAt son añadidos automáticamente por Mongoose (timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new mongoose.Schema<IConversation>( // Especificamos la interfaz
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'ChatMessage',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.pre<IConversation>('save', function (next) {
  if (this.isModified('participants')) {
    this.participants.sort((a, b) => {
        const idA = a.toString();
        const idB = b.toString();
        return idA.localeCompare(idB);
    });
  }
  next();
});

conversationSchema.index({ participants: 1 });

const chatMessageSchema = new mongoose.Schema<IChatMessage>( // Especificamos la interfaz
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderUsername: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);