"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, X, Wand2, Copy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleGeneratePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%^&*'
    const all = upper + lower + numbers + special
    
    let pwd = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)],
    ]
    
    for (let i = 4; i < 16; i++) {
      pwd.push(all[Math.floor(Math.random() * all.length)])
    }
    
    const generated = pwd.sort(() => Math.random() - 0.5).join('')
    setPassword(generated)
    setConfirmPassword(generated)
    setShowPassword(true)
    setShowConfirmPassword(true)
  }

  const calculateStrength = (pwd: string) => {
    if (pwd.length < 8) return "Weak";
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    if (hasUpper && hasNumber && hasSpecial) return "Strong";
    return "Fair";
  };

  const strength = calculateStrength(password);
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const strengthColor =
    password.length === 0
      ? "bg-slate-700"
      : strength === "Weak"
      ? "bg-red-500"
      : strength === "Fair"
      ? "bg-yellow-500"
      : "bg-green-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || "Something went wrong");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-800/50 p-8 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-sm">
      <h2 className="text-2xl font-semibold mb-6">Set New Password</h2>
      
      {success ? (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 text-green-400 rounded-md text-center">
          <p className="mb-4">Password reset successfully!</p>
          <Link
            href="/login"
            className="inline-block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Go to Log In
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-md text-sm">
              <p>{error}</p>
              {(error.includes("expired") || error.includes("invalid")) && (
                <div className="mt-2 pt-2 border-t border-red-500/20">
                  <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 font-medium">
                    Request a new link
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-300">New Password</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <Wand2 size={12} />
                  Generate
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white pr-16"
                  placeholder="••••••••"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(password)}
                    className="text-slate-400 hover:text-slate-300 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strengthColor}`} style={{ width: password.length === 0 ? '0%' : strength === 'Weak' ? '33%' : strength === 'Fair' ? '66%' : '100%' }}></div>
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">{password.length > 0 ? strength : ""}</span>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {hasLength ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-slate-500" />}
                  <span className={hasLength ? "text-slate-300" : "text-slate-500"}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUpper ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-slate-500" />}
                  <span className={hasUpper ? "text-slate-300" : "text-slate-500"}>At least one uppercase letter (A-Z)</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasNumber ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-slate-500" />}
                  <span className={hasNumber ? "text-slate-300" : "text-slate-500"}>At least one number (0-9)</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasSpecial ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-slate-500" />}
                  <span className={hasSpecial ? "text-slate-300" : "text-slate-500"}>At least one special character (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || password.length === 0 || confirmPassword.length === 0}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-md font-medium transition-colors mt-2"
            >
              {isLoading ? "Saving..." : "Reset Password"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
