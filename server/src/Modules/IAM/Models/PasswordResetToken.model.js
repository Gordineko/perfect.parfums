// src/Modules/IAM/models/PasswordResetToken.model.js
import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const PasswordResetTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true,
  },
  token: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  // истекает через 1 час
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 1000 * 60 * 60),
  },
}, {
  timestamps: true,
  collection: 'password_reset_tokens',
});

// индекс на автоматическое удаление по TTL можно добавить позже
// PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetTokenModel =
  models.PasswordResetToken || model('PasswordResetToken', PasswordResetTokenSchema);
