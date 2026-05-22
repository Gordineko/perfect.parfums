import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const PhoneVerificationSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    codeHash: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    cooldownUntil: {
      type: Date,
      default: null,
    },
    sendWindowStartedAt: {
      type: Date,
      default: null,
    },
    sendAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifyAttemptsRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMessageId: {
      type: String,
      default: '',
    },
    lastProviderStatus: {
      type: String,
      default: '',
    },
    deleteAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    collection: 'phone_verifications',
  }
);

PhoneVerificationSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });

export const PhoneVerificationModel =
  models.PhoneVerification || model('PhoneVerification', PhoneVerificationSchema);