"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function DangerZone() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to delete account");
        setIsLoading(false);
      } else {
        await signOut({ callbackUrl: "/login" });
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mt-12 border-t border-red-500/20 pt-8">
        <h3 className="text-xl font-semibold text-red-500 mb-2">Danger Zone</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-red-500/5 border border-red-500/20 rounded-xl p-6">
          <div>
            <p className="text-slate-300 font-medium">Delete Account</p>
            <p className="text-sm text-slate-400 mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-transparent hover:bg-red-500/10 border border-red-500 text-red-500 rounded-md font-medium transition-colors whitespace-nowrap self-start sm:self-center"
          >
            Delete Account
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h4 className="text-xl font-semibold text-white mb-2">Are you sure?</h4>
            <p className="text-slate-400 mb-6">
              This will permanently delete your account. You cannot undo this.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError("");
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-md font-medium transition-colors"
              >
                {isLoading ? "Deleting..." : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
