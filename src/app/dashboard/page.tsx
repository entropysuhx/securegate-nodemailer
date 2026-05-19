import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import DangerZone from "./DangerZone";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user?.emailVerified) {
    redirect("/login?error=Please verify your email before accessing the dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <LogoutButton />
        </header>

        <main className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur-sm shadow-xl">
          <h2 className="text-2xl font-medium mb-2">
            Welcome back, <span className="text-blue-400">{session.user.name || 'User'}</span>
          </h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <span className="w-32 text-slate-400">Email:</span>
              <span className="font-medium">{session.user.email}</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 text-slate-400">Status:</span>
              <span className="px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
                Verified
              </span>
            </div>
          </div>
        </main>

        <DangerZone />
      </div>
    </div>
  );
}
