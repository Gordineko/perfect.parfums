// utils/getNextOrderNumber.js
import OrderCounter from "../Models/OrderCounter.js";

export async function getNextOrderNumber() {
  const doc = await OrderCounter.findOneAndUpdate(
    { key: "order" },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

  return doc.seq; // 1, 2, 3, ...
}
