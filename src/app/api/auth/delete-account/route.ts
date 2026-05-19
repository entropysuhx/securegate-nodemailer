import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.delete({
      where: { email: session.user.email },
    });

    return NextResponse.json({ message: "Account deleted" }, { status: 200 });
  } catch (error) {
    console.error('[DELETE_ACCOUNT] Error:', error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        message: "An unexpected error occurred. Please try again."
      },
      { status: 500 }
    );
  }
}
