import jwt from "jsonwebtoken";
import logger from "./config/logger.js";
import User from "./models/user.model.js";

export const seedAdmin = async (): Promise<void> => {
  try {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error("Admin credentials missing in .env");
    }

    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (existingAdmin) {
      logger.info("✅ Admin already exists");
      return;
    }

    // const hashedPassword = await bcrypt.hash(
    //   process.env.ADMIN_PASSWORD,
    //   10
    // );

    // ✅ Generate refresh token
    const refreshToken = jwt.sign(
      { email: process.env.ADMIN_EMAIL, role: "admin" },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: "7d" }
    );

    await User.create({
      name: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
      phone: process.env.ADMIN_PHONE,
      refreshToken, 
    });

    logger.info("🚀 Admin created successfully");
  } catch (error) {
    logger.error("❌ Error seeding admin:", error);
  }
};