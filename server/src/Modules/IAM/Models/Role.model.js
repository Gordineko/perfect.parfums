
import { Schema, model } from 'mongoose';
const RoleSchema = new Schema({
  name: { type: String, unique: true, required: true, trim: true },
  description: { type: String, default: '' },
  permissions: { type: [String], default: [], index: true },
}, { timestamps: true });
export const Role = model('Role', RoleSchema);
