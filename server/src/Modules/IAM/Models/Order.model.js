import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const OrderItemSchema = new Schema(
  {
    offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "ProductGroup", default: null },

    sku: { type: String, default: "" },
    optionKey: { type: String, default: "" },
    optionValues: { type: [Schema.Types.Mixed], default: [] },

    titleSnapshot: { type: Schema.Types.Mixed, default: {} },
    imgSnapshot: { type: String, default: "" },

    qty: { type: Number, default: 1, min: 1 },
    originalPricePerUnit: { type: Number, default: 0 },
    discountType: { type: String, default: "none" },
    discount: { type: Number, default: 0 },
    discountUAH: { type: Number, default: 0 },
    discountAmountPerUnit: { type: Number, default: 0 },
    discountSubtotal: { type: Number, default: 0 },
    pricePerUnit: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    payment_method_id: { type: Number, default: null },
    payment_method: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    description: { type: String, default: "" },

    status: {
      type: String,
      default: "",
    },

    invoiceId: { type: String, default: "" },
    pageUrl: { type: String, default: "" },

    monoPartsOrderId: { type: String, default: "" },
    partsCount: { type: Number, default: 0 },

    sitniksOrderId: { type: Number, default: null },

    monoPartsConfirmed: { type: Boolean, default: false },
    monoPartsConfirmedAt: { type: Date, default: null },
    monoPartsConfirmResponse: { type: Schema.Types.Mixed, default: null },

    reference: { type: String, default: "" },
  },
  { _id: false }
);

const SitniksSchema = new Schema(
  {
    orderId: { type: Number, default: null },
    statusId: { type: Number, default: null },
    statusCode: { type: String, default: "" },
    statusTitle: { type: String, default: "" },
    lastSyncAt: { type: Date, default: null },
  },
  { _id: false }
);

const ChangeLogItemSchema = new Schema(
  {
    action: { type: String, default: "" },
    byUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    payload: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: Number, unique: true, index: true },
    order_number: { type: String, unique: true, index: true },
    idempotencyKey: { type: String, index: true, sparse: true },
    requestHash: { type: String, default: "" },

    payments: { type: [PaymentSchema], default: [] },

    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },

    items: { type: [OrderItemSchema], default: [] },

    subtotal: { type: Number, default: 0 },
    usedBonusBalance: { type: Number, default: 0 },
    usedReferralBalance: { type: Number, default: 0 },
    totalToPay: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },

    currency: { type: String, default: "UAH" },

    lastName: { type: String, default: "" },
    firstName: { type: String, default: "" },
    middleName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    customerEmail: { type: String, default: "" },

    deliveryProvince: { type: String, default: "" },
    deliveryCity: { type: String, default: "" },
    deliveryPostOffice: { type: String, default: "" },
    deliveryMethod: { type: String, default: "", index: true },

    promoCode: { type: String, default: "" },

    status: {
      type: String,
    
      default: "new",
      index: true,
    },

    paymentStatus: {
      type: String,
      
      default: "unpaid",
      index: true,
    },

    payment: { type: String, default: "", index: true },

    installmentMonths: { type: Number, default: 0 },

    adminDiscount: { type: Number, default: 0 },
    adminDiscountComment: { type: String, default: "" },

    customerType: {
      type: String,
      default: "guest",
      index: true,
    },

    adminComment: { type: String, default: "" },

    changeLog: {
      type: [ChangeLogItemSchema],
      default: [],
    },

    sitniks: { type: SitniksSchema, default: {} },
  },
  {
    collection: "orders",
    timestamps: true,
  }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ payment: 1, createdAt: -1 });
OrderSchema.index({ customerType: 1, createdAt: -1 });
OrderSchema.index({ customerPhone: 1 });
OrderSchema.index({ customerEmail: 1 });

export const OrderModel = models.Order || model("Order", OrderSchema);