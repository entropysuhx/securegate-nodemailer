import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: "Verification email sent" }, { status: 200 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "This account is already verified" }, { status: 400 });
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });

    const token = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 15 * 60 * 1000)
      }
    });

    await sendVerificationEmail(email, token, req.headers.get("origin"));

    return NextResponse.json({ message: "Verification email sent" }, { status: 200 });
  } catch (error) {
    console.error('[RESEND_VERIFICATION] Error:', error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        message: "An unexpected error occurred. Please try again."
      },
      { status: 500 }
    );
  }
}
