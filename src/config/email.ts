import nodemailer from "nodemailer";
import type { IMessage } from "../types/index.js";
import type { EmailOptions, EmailTemplate } from "../types/index.js";
import logger from "./logger.js";

const createTransporter = (): nodemailer.Transporter =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export const sendEmail = async (
  options: EmailOptions,
): Promise<nodemailer.SentMessageInfo> => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text ?? options.html.replace(/<[^>]*>/g, ""),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    throw error;
  }
};

// ─── Email Templates ──────────────────────────────────────────────────────────
export const emailTemplates = {
  passwordReset: (resetUrl: string, name: string): EmailTemplate => ({
    subject: "Password Reset Request",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#333">Password Reset</h2>
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <div style="text-align:center;margin:30px 0">
          <a href="${resetUrl}"
             style="background:#4F46E5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">
            Reset Password
          </a>
        </div>
        <p>This link expires in 10 minutes.</p>
        <p>If you didn't request this, ignore this email.</p>
        <hr style="border:1px solid #eee;margin:20px 0"/>
        <p style="color:#888;font-size:12px">Portfolio API — Security Team</p>
      </div>`,
  }),

  contactNotification: (
    message: Pick<IMessage, "name" | "email" | "phone" | "message">,
  ): EmailTemplate => ({
    subject: `New Contact Message from ${message.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#333">New Contact Message</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold;width:120px">From:</td><td>${message.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email:</td><td>${message.email}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Subject:</td><td>${message.phone}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Message:</td><td>${message.message}</td></tr>
        </table>
      </div>`,
  }),

  subscriptionConfirm: (unsubscribeUrl: string): EmailTemplate => ({
    subject: "Welcome to the Newsletter!",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#333">You're subscribed!</h2>
        <p>Thanks for subscribing. You'll receive updates on new projects and articles.</p>
        <p><a href="${unsubscribeUrl}" style="color:#888;font-size:12px">Unsubscribe at any time</a></p>
      </div>`,
  }),
};
