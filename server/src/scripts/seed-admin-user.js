import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { AdminUserModel } from "../Modules/AdminUserModule/Models/AdminUser.model.js";
import { AdminRoleModel } from "../Modules/AdminUserModule/Models/AdminRole.model.js";

dotenv.config();

async function run() {
  await mongoose.connect("mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin");

  const role = await AdminRoleModel.findOne({ code: "owner" });
  if (!role) {
    throw new Error('Role "owner" not found. Run seed-admin-role.js first.');
  }

  const login = "test";
  const plainPassword = "test874@323948@431!!";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const admin = await AdminUserModel.findOneAndUpdate(
    { login },
    {
      $set: {
        firstName: "Семен",
        lastName: "Семенов",
        middleName: "",
        phone: "+38 (095) 765 43 21",
        email: "semen.semenov@example.com",
        login,
        passwordHash,
        status: "active",
        roles: [role._id],
      },
    },
    {
      new: true,
      upsert: true,
    }
  ).populate("roles");

  console.log("Admin user ready:");
  console.log({
    _id: String(admin._id),
    login: admin.login,
    email: admin.email,
    password: plainPassword,
    roles: admin.roles.map((r) => ({
      _id: String(r._id),
      code: r.code,
      name: r.name,
    })),
  });

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Seed admin error:", err);
  await mongoose.disconnect();
  process.exit(1);
});