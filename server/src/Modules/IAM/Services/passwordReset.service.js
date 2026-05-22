// src/Modules/IAM/Services/passwordReset.service.js
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { UserModel } from '../Models/User.model.js';
import { PasswordResetTokenModel } from '../Models/PasswordResetToken.model.js';

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 5 * 60 * 1000;

async function issueResetTokenForUser(user) {
  if (!user?._id) {
    return { error: 'User not found' };
  }

  await PasswordResetTokenModel.deleteMany({ userId: user._id });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  const prt = new PasswordResetTokenModel({
    userId: user._id,
    token,
    expiresAt,
  });

  await prt.save();

  return {
    ok: true,
    resetToken: token,
    expiresAt,
    expiresIn: Math.ceil(RESET_TOKEN_TTL_MS / 1000),
  };
}

async function resetPassword(token, newPassword) {
  if (!token || !newPassword) {
    return { error: 'Token and password are required' };
  }

  // находим запись токена
  const record = await PasswordResetTokenModel.findOne({ token });
  if (!record) {
    return { error: 'Invalid token' };
  }

  // проверяем срок
  if (record.expiresAt < new Date()) {
    return { error: 'Token expired' };
  }

  // ищем юзера
  const user = await UserModel.findById(record.userId);
  if (!user) {
    return { error: 'User not found' };
  }

  // хешим новый пароль
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  user.passwordHash = hash;
  await user.save();

  // удаляем использованный токен (one-time)
  await PasswordResetTokenModel.deleteOne({ _id: record._id });

  return { ok: true };
}

export const passwordResetService = {
  issueResetTokenForUser,
  resetPassword,
};
