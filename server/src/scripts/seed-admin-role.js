import mongoose from "mongoose";
import dotenv from "dotenv";
import { AdminRoleModel } from "../Modules/AdminUserModule/Models/AdminRole.model.js";

dotenv.config();

async function run() {
  await mongoose.connect("mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin");

  const role = await AdminRoleModel.findOneAndUpdate(
    { code: "owner" },
    {
      $set: {
        name: "Власник",
        code: "owner",
        description: "Повний доступ до адмін-панелі",
        level: 999,
        permissions: ["full.access"],
        isSystem: true,
        isActive: true,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  console.log("Admin role ready:", {
    _id: String(role._id),
    code: role.code,
    name: role.name,
  });

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Seed role error:", err);
  await mongoose.disconnect();
  process.exit(1);
});