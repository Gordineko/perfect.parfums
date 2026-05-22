/**
 * seed-orders-and-users.js
 *
 * Создаёт тестовые данные:
 *  1) Гостевые заказы (без userId)
 *  2) Пользователей сайта
 *  3) Заказы от этих пользователей
 *
 * Запуск:
 *   node --experimental-vm-modules src/scripts/seed-orders-and-users.js
 *   или
 *   node src/scripts/seed-orders-and-users.js   (если type=module в package.json)
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { OrderModel } from "../Modules/IAM/Models/Order.model.js";
import { UserModel } from "../Modules/IAM/Models/User.model.js";
import { getNextOrderNumber } from "../Modules/IAM/utils/getNextOrderNumber.js";

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://keykeyteams:HzmjraG9wuLeuzCC@cluster0.pr9rchp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// ─────────────────────────────────────────
// OFFERS  (данные из запроса)
// ─────────────────────────────────────────
const OFFERS = [
  {
    _id: new mongoose.Types.ObjectId("69ef30936e99156beb0b3bff"),
    groupId: new mongoose.Types.ObjectId("69ef30940fb27cd05f427298"),
    sku: "HIGHHEELS-001-05",
    price: 3720,
    img: "https://picsum.photos/seed/high-heels-scarlet-pro-gloss-1-main/900/1200",
    optionKey: "A1:white|A2:24.5|A3:triangle|A4:11|A5:standard",
    optionValues: ["white", 24.5, "triangle", 11, "standard"],
    titleSnapshot: { ua: "Туфлі на підборах High Heels 001", en: "High Heels Shoes 001" },
  },
  {
    _id: new mongoose.Types.ObjectId("69ef30936e99156beb0b3c00"),
    groupId: new mongoose.Types.ObjectId("69ef30940fb27cd05f427298"),
    sku: "HIGHHEELS-001-06",
    price: 3810,
    img: "https://picsum.photos/seed/high-heels-scarlet-pro-gloss-1-main/900/1200",
    optionKey: "A1:white|A2:25.5|A3:triangle|A4:11|A5:suede",
    optionValues: ["white", 25.5, "triangle", 11, "suede"],
    titleSnapshot: { ua: "Туфлі на підборах High Heels 001", en: "High Heels Shoes 001" },
  },
  {
    _id: new mongoose.Types.ObjectId("69ef30936e99156beb0b3c01"),
    groupId: new mongoose.Types.ObjectId("69ef30940fb27cd05f427298"),
    sku: "HIGHHEELS-001-07",
    price: 3810,
    img: "https://picsum.photos/seed/high-heels-scarlet-pro-gloss-1-main/900/1200",
    optionKey: "A1:white|A2:24|A3:triangle|A4:11|A5:suede",
    optionValues: ["white", 24, "triangle", 11, "suede"],
    titleSnapshot: { ua: "Туфлі на підборах High Heels 001", en: "High Heels Shoes 001" },
  },
];

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildItems(offerList) {
  return offerList.map((o) => {
    const qty = Math.floor(Math.random() * 2) + 1;
    return {
      offerId: o._id,
      groupId: o.groupId,
      sku: o.sku,
      optionKey: o.optionKey,
      optionValues: o.optionValues,
      titleSnapshot: o.titleSnapshot,
      imgSnapshot: o.img,
      qty,
      pricePerUnit: o.price,
      subtotal: o.price * qty,
    };
  });
}

function calcTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  return { subtotal, totalToPay: subtotal, finalPrice: subtotal };
}

const STATUSES = ["new", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_METHODS = ["card", "postpaid", "monoparts"];
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];
const DELIVERY_CITIES = ["Київ", "Харків", "Одеса", "Дніпро", "Запоріжжя"];
const DELIVERY_PROVINCES = ["Київська", "Харківська", "Одеська", "Дніпропетровська", "Запорізька"];

async function createOrder({ userId = null, customerType = "guest", overrides = {} } = {}) {
  const num = await getNextOrderNumber();

  const selectedOffers = [pick(OFFERS), pick(OFFERS)].filter(
    (o, i, arr) => arr.findIndex((x) => String(x._id) === String(o._id)) === i
  );
  const items = buildItems(selectedOffers);
  const { subtotal, totalToPay, finalPrice } = calcTotals(items);

  const status = pick(STATUSES);
  const payment = pick(PAYMENT_METHODS);
  const cityIdx = Math.floor(Math.random() * DELIVERY_CITIES.length);

  const doc = new OrderModel({
    orderNumber: num,
    order_number: String(num),
    userId,
    customerType,
    items,
    subtotal,
    totalToPay,
    finalPrice,
    currency: "UAH",
    status,
    payment,
    paymentStatus: payment === "postpaid" ? "unpaid" : pick(PAYMENT_STATUSES),
    deliveryMethod: "nova_poshta",
    deliveryCity: DELIVERY_CITIES[cityIdx],
    deliveryProvince: DELIVERY_PROVINCES[cityIdx],
    deliveryPostOffice: `Відділення №${Math.floor(Math.random() * 50) + 1}`,
    ...overrides,
  });

  await doc.save();
  return doc;
}

// ─────────────────────────────────────────
// GUEST ORDERS DATA
// ─────────────────────────────────────────
const GUEST_CONTACTS = [
  { firstName: "Олена", lastName: "Коваль",    customerPhone: "+380501112233", customerEmail: "olena.koval@example.com" },
  { firstName: "Марина", lastName: "Бойко",   customerPhone: "+380502223344", customerEmail: "maryna.boiko@example.com" },
  { firstName: "Надія",  lastName: "Ткаченко", customerPhone: "+380503334455", customerEmail: "nadiia.tkach@example.com" },
  { firstName: "Ірина",  lastName: "Мельник",  customerPhone: "+380504445566", customerEmail: "iryna.melnyk@example.com" },
  { firstName: "Тетяна", lastName: "Гриценко", customerPhone: "+380505556677", customerEmail: "tetyana.hryts@example.com" },
];

// ─────────────────────────────────────────
// USERS DATA
// ─────────────────────────────────────────
const USERS_DATA = [
  { firstName: "Юлія",    lastName: "Савченко", email: "yuliia.savchenko@example.com", phone: "+380671234567", password: "Test1234!" },
  { firstName: "Вікторія",lastName: "Дяченко",  email: "viktoriia.dyachenko@example.com", phone: "+380672345678", password: "Test1234!" },
  { firstName: "Оксана",  lastName: "Шевченко", email: "oksana.shevchenko@example.com",   phone: "+380673456789", password: "Test1234!" },
];

// ─────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────
async function main() {
  console.log("🔌 Connecting to MongoDB…");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log("✅ Connected\n");

  // ── 1. Guest orders ─────────────────────
  console.log("📦 Creating guest orders…");
  const guestOrders = [];

  for (const contact of GUEST_CONTACTS) {
    const order = await createOrder({
      customerType: "guest",
      overrides: { ...contact },
    });
    console.log(`  ✔ Guest order #${order.orderNumber}  ${contact.firstName} ${contact.lastName}`);
    guestOrders.push(order);
  }

  // ── 2. Users ────────────────────────────
  console.log("\n👤 Creating users…");
  const createdUsers = [];

  for (const ud of USERS_DATA) {
    const exists = await UserModel.findOne({ $or: [{ email: ud.email }, { phone: ud.phone }] });
    if (exists) {
      console.log(`  ⚠ User ${ud.email} already exists — skipping`);
      createdUsers.push(exists);
      continue;
    }

    const passwordHash = await bcrypt.hash(ud.password, 10);
    const referralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const user = new UserModel({
      email: ud.email,
      phone: ud.phone,
      firstName: ud.firstName,
      lastName: ud.lastName,
      passwordHash,
      referralCode,
      status: "active",
    });

    await user.save();
    console.log(`  ✔ User ${ud.email}  (id: ${user._id})`);
    createdUsers.push(user);
  }

  // ── 3. User orders ───────────────────────
  console.log("\n🛒 Creating orders for registered users…");

  for (const user of createdUsers) {
    // 2–3 заказа на каждого пользователя
    const count = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < count; i++) {
      const order = await createOrder({
        userId: user._id,
        customerType: "registered",
        overrides: {
          firstName: user.firstName,
          lastName: user.lastName,
          customerEmail: user.email,
          customerPhone: user.phone || "",
        },
      });

      // пишем шорткат в user.orders
      user.orders.push({
        orderId: order._id,
        total: order.finalPrice,
        status: order.status,
      });

      console.log(`  ✔ Order #${order.orderNumber} for ${user.email}`);
    }

    await user.save();
  }

  console.log("\n✅ Seed complete!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
