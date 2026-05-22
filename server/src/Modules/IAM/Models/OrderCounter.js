// models/OrderCounter.js
import mongoose from "mongoose";

const OrderCounterSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true, // например 'order'
  },
  seq: {
    type: Number,
    required: true,
    default: 0,
  },
});

export default mongoose.models.OrderCounter ||
  mongoose.model("OrderCounter", OrderCounterSchema);
