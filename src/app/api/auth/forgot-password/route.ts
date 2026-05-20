import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordRatelimit } from "@/lib/ratelimit";
import * as z from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 
               req.headers.get('x-real-ip') ?? 
               '127.0.0.1';

    const { success } = await forgotPasswordRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please wait 10 minutes and try again.",
          message: "Too many requests. Please wait 10 minutes and try again."
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }

    const { email } = result.data;
    const successMessage = "If an account exists with this email, you will receive a password reset link shortly.";

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.passwordResetToken.deleteMany({
        where: { email }
      });

      const token = generateToken();
      await prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expires: new Date(Date.now() + 60 * 60 * 1000)
        }
      });

      await sendPasswordResetEmail(email, token, req.headers.get("origin"));
    }

    return NextResponse.json({ message: successMessage }, { status: 200 });
  } catch (error) {
    console.error('[FORGOT_PASSWORD] Error:', error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        message: "An unexpected error occurred. Please try again."
      },
      { status: 500 }
    );
  }
}
