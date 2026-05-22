import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// Одна позиция корзины
const CartItemSchema = new Schema({
  offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },

  qty: { type: Number, default: 1, min: 1 },

  // фиксируем цену на момент добавления
  priceAtAdd: { type: Number },

  // (опционально) для ускорения UI/рендера
  groupId: { type: Schema.Types.ObjectId, ref: "ProductGroup" },
  sku: String,
}, { _id: false });

// Шорткат по заказам для кабинета юзера
const OrderRefSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  createdAt: { type: Date, default: Date.now },
  total: { type: Number },
  status: { type: String }
}, { _id: false });

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },

  passwordHash: {
    type: String
  },

  firstName: {
    type: String,
    trim: true
  },

  lastName: {
    type: String,
    trim: true
  },

  middleName: {
    type: String,
    trim: true,
  },

  birthDate: {
    type: Date,
  },

  phone: {
    type: String,
    unique: true,
    sparse: true
  },

  status: {
    type: String,
    enum: ['active', 'blocked', 'pending'],
    default: 'active'
  },

  // 💸 обычные бонусы
  bonusBalance: {
    type: Number,
    default: 0
  },

  // 💰 реферальные бонусы
  referralBalance: {
    type: Number,
    default: 0
  },

  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  referralCode: {
    type: String,
    unique: true,
    index: true
  },
  referralCount: { type: Number, default: 0 },

  // анти-фрод
  signupIp: {
    type: String
  },

  // 🛒 корзина
  cart: {
    type: [CartItemSchema],
    default: []
  },

  // 📦 история заказов
  orders: {
    type: [OrderRefSchema],
    default: []
  },

  // 📍 Данные для доставки
  deliveryProvince: {
    type: String
  },
  deliveryCity: {
    type: String
  },
  deliveryPostOffice: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductGroup',
    default: []
  }],
});


export const UserModel = models.User || model('User', UserSchema);
