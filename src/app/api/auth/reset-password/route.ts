import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as z from "zod";

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid payload", errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { token, password } = result.data;

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!tokenRecord) {
      return NextResponse.json({ message: "This reset link is invalid or has already been used" }, { status: 400 });
    }

    if (tokenRecord.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: tokenRecord.id }
      });
      return NextResponse.json({ message: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: tokenRecord.email },
      data: { password: hashedPassword }
    });

    await prisma.passwordResetToken.delete({
      where: { id: tokenRecord.id }
    });

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
  } catch (error) {
    console.error('[RESET_PASSWORD] Error:', error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        message: "An unexpected error occurred. Please try again."
      },
      { status: 500 }
    );
  }
}
