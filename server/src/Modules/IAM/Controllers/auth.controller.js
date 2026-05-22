// controllers/auth.controller.js

import { authService } from "../Services/auth.service.js";
import { passwordResetService } from "../Services/passwordReset.service.js";
import { phoneOtpService } from "../Services/phoneOtp.service.js";
import { sendResetEmail } from "../Services/email.service.js";
import jwt from "jsonwebtoken";

import { UserModel } from "../Models/User.model.js";
import { OrderModel } from "../Models/Order.model.js";

import { ProductGroup } from "../../CatalogModule/Models/ProductGroup.model.js";

/**
 * =========================
 * Helpers
 * =========================
 */
function getTokenFromReq(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  return token || null;
}

function getUserIdFromToken(token) {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_here"
    );
    return decoded?.sub || null;
  } catch {
    return null;
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getUserFromReq(req) {
  const token = getTokenFromReq(req);
  if (!token) return null;

  const userId = getUserIdFromToken(token);
  if (!userId) return null;

  return await UserModel.findById(userId);
}

/**
 * Wishlist cards:
 * user.wishlist = [ProductGroupId, ...]
 */
async function buildWishlistCards(groupIdsArray) {
  if (!groupIdsArray || groupIdsArray.length === 0) return [];

  const groups = await ProductGroup.find({ _id: { $in: groupIdsArray } })
    // .populate("reviews")
    .lean();

  // вернуть в том же порядке, как в user.wishlist
  const byId = Object.fromEntries(groups.map((g) => [String(g._id), g]));

  return groupIdsArray
    .map((id) => byId[String(id)])
    .filter(Boolean);
}

export function authController(router) {
  router.post("/auth/phone/request-code", async (req, res, next) => {
    try {
      const result = await phoneOtpService.requestCode(req.body || {});
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  });

  router.post("/auth/phone/verify-code", async (req, res, next) => {
    try {
      const result = await phoneOtpService.verifyCode(req.body || {});
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  });

  /**
   * =========================
   * POST /auth/register
   * =========================
   */
  router.post("/auth/register", async (req, res, next) => {
    try {
      const { password, firstName, ref } = req.body || {};
      const email = normalizeEmail(req.body?.email);

      if (!email || !isValidEmail(email) || !password || !firstName) {
        return res.status(400).json({
          message: "email, password and firstName are required",
        });
      }

      const clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        null;

      const r = await authService.register({
        email,
        password,
        firstName,
        ref,
        signupIp: clientIp,
      });

      if (r.conflict) {
        return res.status(409).json({ message: "User already exists" });
      }

      const { user, token, expiresIn } = r;

      return res.status(201).json({
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
        token,
        expiresIn,
      });
    } catch (e) {
      next(e);
    }
  });

  /**
   * =========================
   * POST /auth/login
   * =========================
   */
  router.post("/auth/login", async (req, res, next) => {
    try {
      const { password } = req.body || {};
      const email = normalizeEmail(req.body?.email);

      if (!email || !isValidEmail(email) || !password) {
        return res.status(400).json({ message: "email and password are required" });
      }

      const r = await authService.login({ email, password });

      if (r.invalid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (r.forbidden) {
        return res.status(403).json({ message: "User is not active" });
      }

      const { user, token, expiresIn } = r;

      return res.json({
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
        token,
        expiresIn,
      });
    } catch (e) {
      next(e);
    }
  });

  /**
   * =========================
   * GET /auth/me
   * - возвращает юзера + cart + orders + wishlist(cards)
   * =========================
   */
  router.get("/auth/me", async (req, res) => {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ message: "No token provided" });

    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ message: "Token is invalid or expired" });

    try {
      const user = await UserModel.findById(userId)
        .populate("cart.offerId")
        .populate("orders.orderId")
        .populate("orders.orderId.items.offerId")
        .lean();

      if (!user) return res.status(404).json({ message: "User not found" });

      const wishlistCards = await buildWishlistCards(user.wishlist || []);

      return res.json({
        id: String(user._id),
        email: user.email,

        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        birthDate: user.birthDate,
        phone: user.phone,

        deliveryProvince: user.deliveryProvince,
        deliveryCity: user.deliveryCity,
        deliveryPostOffice: user.deliveryPostOffice,

        status: user.status,
        bonusBalance: user.bonusBalance,
        referralBalance: user.referralBalance,
        referralCode: user.referralCode,
        invitedBy: user.invitedBy,

        cart: user.cart || [],
        wishlist: wishlistCards,
        orders: user.orders || [],

        createdAt: user.createdAt,
      });
    } catch (e) {
      console.error("JWT/Auth error:", e);
      return res.status(401).json({ message: "Token is invalid or expired" });
    }
  });

  /**
   * =========================
   * PATCH /auth/me
   * =========================
   */
  router.patch("/auth/me", async (req, res) => {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ message: "No token provided" });

    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ message: "Token is invalid or expired" });

    try {
      const user = await UserModel.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const {
        firstName,
        lastName,
        middleName,
        birthDate,
        phone,
        deliveryProvince,
        deliveryCity,
        deliveryPostOffice,
      } = req.body || {};

      if (firstName != null) user.firstName = firstName;
      if (lastName != null) user.lastName = lastName;
      if (middleName != null) user.middleName = middleName;
      if (birthDate != null) user.birthDate = birthDate ? new Date(birthDate) : null;
      if (phone != null) user.phone = phone;

      if (deliveryProvince != null) user.deliveryProvince = deliveryProvince;
      if (deliveryCity != null) user.deliveryCity = deliveryCity;
      if (deliveryPostOffice != null) user.deliveryPostOffice = deliveryPostOffice;

      await user.save();

      return res.status(200).json({
        id: String(user._id),
        email: user.email,

        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        birthDate: user.birthDate,
        phone: user.phone,

        deliveryProvince: user.deliveryProvince,
        deliveryCity: user.deliveryCity,
        deliveryPostOffice: user.deliveryPostOffice,

        status: user.status,
        bonusBalance: user.bonusBalance,
        referralBalance: user.referralBalance,
        referralCode: user.referralCode,
        invitedBy: user.invitedBy,

        createdAt: user.createdAt,
      });
    } catch (e) {
      console.error("PATCH /auth/me error:", e);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * =========================
   * GET /user/orders
   * =========================
   */
  router.get("/user/orders", async (req, res) => {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    try {
      const orders = await OrderModel.find({ userId: user._id })
        .populate("items.offerId")
        .lean();

      return res.json(orders);
    } catch (e) {
      console.error("Error fetching orders:", e);
      return res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  /**
   * =========================
   * POST /auth/forgot-password
   * =========================
   */
  router.post("/auth/forgot-password", async (req, res) => {
    try {
      const email = normalizeEmail(req.body?.email);

      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ message: "email must be a valid email" });
      }

      const user = await UserModel.findOne({
        $or: [
          { email },
          { phone: email },
        ],
      });

      if (user) {
        const result = await passwordResetService.issueResetTokenForUser(user);

        if (result?.error) {
          return res.status(500).json({ message: "An error occurred" });
        }

        await sendResetEmail(user.email || user.phone || email, result.resetToken);
      }

      // Do not disclose whether the email exists in the database.
      return res.json({
        ok: true,
        message: "If such a user exists, you will receive a password reset email.",
      });
    } catch (err) {
      console.error("forgot-password error:", err);

      if (err?.statusCode) {
        return res.status(err.statusCode).json({
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        });
      }

      return res.status(500).json({
        message: "An error occurred, please try again later.",
      });
    }
  });

  /**
   * =========================
   * POST /auth/reset-password
   * =========================
   */
  router.post("/auth/reset-password", async (req, res) => {
    try {
      const { resetToken, token, password } = req.body || {};
      const recoveryToken = resetToken || token;
      const r = await passwordResetService.resetPassword(recoveryToken, password);

      if (r?.error) {
        if (r.error === "Token and password are required") {
          return res.status(400).json({ message: "Token and password are required" });
        }
        if (r.error === "Invalid token" || r.error === "Token expired") {
          return res.status(400).json({ message: "Invalid or expired token" });
        }
        if (r.error === "User not found") {
          return res.status(404).json({ message: "User not found" });
        }
        return res.status(500).json({ message: "An error occurred" });
      }

      return res.json({ message: "Password successfully updated" });
    } catch (err) {
      console.error("reset-password error:", err);
      return res.status(500).json({
        message: "An error occurred, please try again later.",
      });
    }
  });

  /**
   * =========================
   * POST /auth/logout
   * =========================
   */
  router.post("/auth/logout", async (req, res) => {
    try {
      return res.json({ success: true });
    } catch (e) {
      console.error("Logout error:", e);
      return res.status(500).json({ message: "Failed to logout" });
    }
  });
}
