import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { PhoneVerificationModel } from '../Models/PhoneVerification.model.js';
import { UserModel } from '../Models/User.model.js';
import { passwordResetService } from './passwordReset.service.js';
import { turboSmsService } from './turboSms.service.js';

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const DELETE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_SEND_ATTEMPTS_PER_WINDOW = 5;
const MAX_VERIFY_ATTEMPTS = 5;

function createHttpError(statusCode, code, message, details) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  if (details) err.details = details;
  return err;
}

function secondsUntil(date) {
  if (!date) return 0;
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 1000));
}

function normalizePhone(rawPhone = '') {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) {
    throw createHttpError(400, 'INVALID_PHONE', 'Phone is required');
  }

  let normalizedDigits = digits;

  if (normalizedDigits.startsWith('0')) {
    normalizedDigits = `38${normalizedDigits}`;
  }

  if (!normalizedDigits.startsWith('380')) {
    if (normalizedDigits.length === 9) {
      normalizedDigits = `380${normalizedDigits}`;
    }
  }

  if (!/^380\d{9}$/.test(normalizedDigits)) {
    throw createHttpError(400, 'INVALID_PHONE', 'Phone must be a valid Ukrainian number');
  }

  return `+${normalizedDigits}`;
}

function normalizeCode(rawCode = '') {
  const digits = String(rawCode || '').replace(/\D/g, '');
  if (!/^\d{4}$/.test(digits)) {
    throw createHttpError(400, 'INVALID_PHONE_CODE', 'Code must contain 4 digits');
  }
  return digits;
}

function generateCode() {
  return String(crypto.randomInt(1000, 10000));
}

function hashCode(phone, code) {
  return crypto
    .createHash('sha256')
    .update(`${phone}:${code}`)
    .digest('hex');
}

function issueAuthToken(user) {
  const token = jwt.sign(
    {
      sub: String(user._id),
      phone: user.phone,
    },
    process.env.JWT_SECRET || 'your_jwt_secret_here',
    { expiresIn: '30d' }
  );

  return {
    token,
    expiresIn: 30 * 24 * 60 * 60,
  };
}

async function requestCode({ phone: rawPhone }) {
  const phone = normalizePhone(rawPhone);
  const now = new Date();

  let challenge = await PhoneVerificationModel.findOne({ phone });

  if (challenge?.cooldownUntil && challenge.cooldownUntil.getTime() > now.getTime()) {
    throw createHttpError(
      429,
      'PHONE_CODE_COOLDOWN',
      'SMS code was already requested recently',
      {
        cooldownSeconds: secondsUntil(challenge.cooldownUntil),
      }
    );
  }

  if (!challenge) {
    challenge = new PhoneVerificationModel({ phone });
  }

  const isNewWindow =
    !challenge.sendWindowStartedAt ||
    now.getTime() - challenge.sendWindowStartedAt.getTime() >= SEND_WINDOW_MS;

  const sendAttempts = isNewWindow ? 0 : Number(challenge.sendAttempts || 0);
  const sendWindowStartedAt = isNewWindow ? now : challenge.sendWindowStartedAt;
  const retryAt = new Date(sendWindowStartedAt.getTime() + SEND_WINDOW_MS);

  if (sendAttempts >= MAX_SEND_ATTEMPTS_PER_WINDOW) {
    throw createHttpError(
      429,
      'PHONE_CODE_RATE_LIMIT',
      'Too many SMS code requests',
      {
        cooldownSeconds: secondsUntil(retryAt),
      }
    );
  }

  const code = generateCode();
  const providerResult = await turboSmsService.sendOtpCode({ phone, code });

  challenge.codeHash = hashCode(phone, code);
  challenge.expiresAt = new Date(now.getTime() + CODE_TTL_MS);
  challenge.cooldownUntil = new Date(now.getTime() + RESEND_COOLDOWN_MS);
  challenge.sendWindowStartedAt = sendWindowStartedAt;
  challenge.sendAttempts = sendAttempts + 1;
  challenge.verifyAttemptsRemaining = MAX_VERIFY_ATTEMPTS;
  challenge.lastMessageId = providerResult.messageId;
  challenge.lastProviderStatus = providerResult.responseStatus;
  challenge.deleteAt = new Date(now.getTime() + DELETE_TTL_MS);

  await challenge.save();

  return {
    ok: true,
    phone,
    cooldownSeconds: secondsUntil(challenge.cooldownUntil),
    expiresInSeconds: Math.ceil(CODE_TTL_MS / 1000),
  };
}

async function verifyCode({ phone: rawPhone, code: rawCode, purpose }) {
  const phone = normalizePhone(rawPhone);
  const code = normalizeCode(rawCode);
  const now = new Date();

  const challenge = await PhoneVerificationModel.findOne({ phone });

  if (!challenge?.codeHash || !challenge?.expiresAt || challenge.expiresAt.getTime() <= now.getTime()) {
    throw createHttpError(401, 'PHONE_CODE_EXPIRED', 'SMS code is expired or missing');
  }

  const expectedHash = hashCode(phone, code);

  if (challenge.codeHash !== expectedHash) {
    challenge.verifyAttemptsRemaining = Math.max(0, Number(challenge.verifyAttemptsRemaining || 0) - 1);

    if (challenge.verifyAttemptsRemaining === 0) {
      challenge.codeHash = null;
      challenge.expiresAt = null;
      challenge.cooldownUntil = new Date(now.getTime() + RESEND_COOLDOWN_MS);
      await challenge.save();

      throw createHttpError(
        429,
        'PHONE_CODE_ATTEMPTS_EXHAUSTED',
        'Verification attempts exhausted',
        {
          cooldownSeconds: secondsUntil(challenge.cooldownUntil),
        }
      );
    }

    await challenge.save();

    throw createHttpError(401, 'INVALID_PHONE_CODE', 'Invalid SMS verification code', {
      attemptsRemaining: challenge.verifyAttemptsRemaining,
    });
  }

  challenge.codeHash = null;
  challenge.expiresAt = null;
  challenge.verifyAttemptsRemaining = 0;
  challenge.cooldownUntil = null;
  await challenge.save();

  const user = await UserModel.findOne({ phone });

  if (purpose === 'password_reset') {
    if (!user) {
      return {
        ok: true,
        phone,
        verified: true,
        isRegistered: false,
      };
    }

    const recovery = await passwordResetService.issueResetTokenForUser(user);

    return {
      ok: true,
      phone,
      verified: true,
      isRegistered: true,
      resetToken: recovery.resetToken,
      resetTokenExpiresIn: recovery.expiresIn,
      resetTokenExpiresAt: recovery.expiresAt,
    };
  }

  const auth = user ? issueAuthToken(user) : null;

  return {
    ok: true,
    phone,
    verified: true,
    isRegistered: Boolean(user),
    ...(user
      ? {
          token: auth.token,
          expiresIn: auth.expiresIn,
          user: {
            id: String(user._id),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            middleName: user.middleName,
            birthDate: user.birthDate,
            phone: user.phone,
            status: user.status,
            bonusBalance: user.bonusBalance,
            referralBalance: user.referralBalance,
            referralCode: user.referralCode,
            invitedBy: user.invitedBy,
            deliveryProvince: user.deliveryProvince,
            deliveryCity: user.deliveryCity,
            deliveryPostOffice: user.deliveryPostOffice,
            createdAt: user.createdAt,
          },
        }
      : {}),
  };
}

export const phoneOtpService = {
  requestCode,
  verifyCode,
  normalizePhone,
};