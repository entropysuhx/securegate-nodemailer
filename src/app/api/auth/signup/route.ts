import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signUpSchema } from "@/lib/validations/auth";
import { generateToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { signupRatelimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 
               req.headers.get('x-real-ip') ?? 
               '127.0.0.1';

    const { success } = await signupRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { 
          error: "Too many signup attempts. Please wait 10 minutes and try again.",
          message: "Too many signup attempts. Please wait 10 minutes and try again."
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = signUpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, name } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: null,
      },
    });

    const token = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: "Account created. Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SIGNUP] Error:', error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        message: "An unexpected error occurred. Please try again."
      },
      { status: 500 }
    );
  }
}
