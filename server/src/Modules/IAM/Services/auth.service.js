import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../Models/User.model.js';

const REF_BONUS = 150;
const WELCOME_BONUS = 300;

function generateReferralCode() {
  return 'STR-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function register({ email, password, firstName, ref, signupIp }) {
  const normalizedEmail = normalizeEmail(email);
  console.log(`🔵 [REGISTER] Начало регистрации для: ${email}, IP: ${signupIp}, ref: ${ref || 'нет'}`);

  // Проверка существующего пользователя
  const existing = await UserModel.findOne({
    $or: [
      { email: normalizedEmail },
      { phone: normalizedEmail },
    ],
  });
  if (existing) {
    console.log(`🔴 [REGISTER] Конфликт: пользователь ${email} уже существует`);
    return { conflict: true };
  }

  // Найдём пригласившего по коду
  let inviter = null;
  if (ref) {
    inviter = await UserModel.findOne({
      $or: [
        { referralCode: ref },
        (ref.match(/^[0-9a-fA-F]{24}$/) ? { _id: ref } : null)
      ].filter(Boolean)
    });
    console.log(`🔵 [REGISTER] Поиск приглашающего по ref: ${ref}, найден:`, inviter ? `${inviter.phone} (${inviter._id})` : 'не найден');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // АНТИ-АБУЗ: Проверка ограничений перед регистрацией
  let canRewardReferral = false;
  let antiAbuseChecks = {
    selfReferral: false,
    referralsFromSameIp: 0,
    recentRegistrations: 0,
    maxReferralsPerIp: 1,
    maxRegistrationsPerDay: 3
  };
  
  if (inviter) {
    // 1. Защита от самоприглашения (предварительная)
    antiAbuseChecks.selfReferral = false;
    
    // 2. Проверка количества рефералов с этого IP
    antiAbuseChecks.referralsFromSameIp = await UserModel.countDocuments({
      signupIp: signupIp,
      invitedBy: inviter._id
    });
    
    // 3. Проверка времени между регистрациями с одного IP
    antiAbuseChecks.recentRegistrations = await UserModel.countDocuments({
      signupIp: signupIp,
      createdAt: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // последние 24 часа
      }
    });

    canRewardReferral = 
      !antiAbuseChecks.selfReferral &&
      antiAbuseChecks.referralsFromSameIp < antiAbuseChecks.maxReferralsPerIp &&
      antiAbuseChecks.recentRegistrations < antiAbuseChecks.maxRegistrationsPerDay;

    console.log(`🔵 [ANTI-ABUSE] Проверки для ${email}:`, {
      selfReferral: antiAbuseChecks.selfReferral,
      referralsFromSameIp: `${antiAbuseChecks.referralsFromSameIp}/${antiAbuseChecks.maxReferralsPerIp}`,
      recentRegistrations: `${antiAbuseChecks.recentRegistrations}/${antiAbuseChecks.maxRegistrationsPerDay}`,
      canRewardReferral
    });
  } else {
    console.log(`🔵 [ANTI-ABUSE] Приглашающий не указан, бонусы не начисляются`);
  }

  // Создаём пользователя
  const newUser = new UserModel({
    email: normalizedEmail,
    passwordHash,
    firstName,
    status: 'active',
    referralCode: generateReferralCode(),
    invitedBy: inviter ? inviter._id : null,
    signupIp,
    bonusBalance: WELCOME_BONUS,
    referralBalance: 0,
    cart: [],
    wishlist: [],
    orders: []
  });

  await newUser.save();
  console.log(`🟢 [REGISTER] Пользователь создан: ${newUser._id}`);

  // Финальная проверка самоприглашения (после создания пользователя)
  if (inviter && canRewardReferral) {
    antiAbuseChecks.selfReferral = String(inviter._id) === String(newUser._id);
    if (antiAbuseChecks.selfReferral) {
      canRewardReferral = false;
      console.log(`🔴 [ANTI-ABUSE] Обнаружено самоприглашение! Бонусы отменены.`);
    }
  }

  // Начисление бонусов если все проверки пройдены
  if (canRewardReferral) {
    console.log(`🟢 [BONUS] Начисление бонусов: ${REF_BONUS} каждому`);
    console.log(`🟢 [BONUS] Приглашающий: ${inviter._id} -> +${REF_BONUS}`);
    console.log(`🟢 [BONUS] Новый пользователь: ${newUser._id} -> +${REF_BONUS}`);

    await UserModel.updateOne(
      { _id: inviter._id },
      { $inc: { referralBalance: REF_BONUS } }
    );

    await UserModel.updateOne(
      { _id: newUser._id },
      { $inc: { referralBalance: REF_BONUS } }
    );

    newUser.referralBalance += REF_BONUS;
    console.log(`🟢 [BONUS] Бонусы успешно начислены`);
  } else if (inviter) {
    console.log(`🟡 [BONUS] Бонусы не начислены. Причины:`, {
      selfReferral: antiAbuseChecks.selfReferral,
      tooManyReferrals: antiAbuseChecks.referralsFromSameIp >= antiAbuseChecks.maxReferralsPerIp,
      tooManyRegistrations: antiAbuseChecks.recentRegistrations >= antiAbuseChecks.maxRegistrationsPerDay
    });
  }

  const token = jwt.sign(
    {
      sub: String(newUser._id),
      email: newUser.email
    },
    process.env.JWT_SECRET || 'your_jwt_secret_here',
    { expiresIn: '30d' }
  );

  console.log(`🟢 [REGISTER] Регистрация завершена для: ${email}, ID: ${newUser._id}, Бонусы: ${newUser.referralBalance}`);

  return {
    user: newUser,
    token,
    expiresIn: 30 * 24 * 60 * 60
  };
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({
    $or: [
      { email: normalizedEmail },
      { phone: normalizedEmail },
    ],
  });
  if (!user) return { invalid: true };
  if (!user.passwordHash) return { invalid: true };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { invalid: true };

  if (user.status !== 'active') {
    return { forbidden: true };
  }

  const token = jwt.sign(
    {
      sub: String(user._id),
      email: user.email || normalizedEmail
    },
    process.env.JWT_SECRET||'your_jwt_secret_here',
    { expiresIn: '30d' }
  );

  return {
    user,
    token,
    expiresIn: 30 * 24 * 60 * 60
  };
}

async function me(userId) {
  return UserModel.findById(userId)
    .select(
      '_id email firstName lastName middleName birthDate phone status bonusBalance referralBalance referralCode invitedBy cart wishlist orders createdAt'
    )
    // populate корзины
    .populate({
      path: 'cart.itemId',
      model: 'CatalogItem',
    })
    // populate заказов + вложенный populate на items.itemId
    .populate({
      path: 'orders.orderId',
      model: 'Order',
      populate: {
        path: 'items.itemId',
        model: 'CatalogItem'
      }
    });
}

export const authService = {
  register,
  login,
  me
};
