import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Missing token", { status: 400 });
    }

    const existingToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!existingToken) {
      return NextResponse.redirect(new URL("/verify-email/invalid", req.url));
    }

    if (existingToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: existingToken.id }
      });
      return NextResponse.redirect(new URL("/verify-email/expired", req.url));
    }

    await prisma.user.update({
      where: { email: existingToken.identifier },
      data: { emailVerified: new Date() }
    });

    await prisma.verificationToken.delete({
      where: { id: existingToken.id }
    });

    return NextResponse.redirect(new URL("/verify-email/success", req.url));
  } catch (error) {
    console.error('[VERIFY_EMAIL] Error:', error);
    return new NextResponse("An unexpected error occurred. Please try again.", { status: 500 });
  }
}
