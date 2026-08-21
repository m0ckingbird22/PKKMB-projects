"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email atau password salah");
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-[#1d1c1c] p-6 sm:p-8 rounded-lg border border-gray-500 w-full max-w-md">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="Logo PKKMB"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 text-white">
          PKKMB System
        </h1>
        <p className="text-center text-gray-400 mb-6">Login Panitia</p>

        {error && (
          <div className="bg-inferno/15 text-inferno p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg px-3 py-2 bg-[#1d1c1c] text-white placeholder-gray-500 border border-gray-700 focus:outline-none"
            placeholder="email@panitia.com"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg px-3 py-2 bg-[#1d1c1c] text-white placeholder-gray-500 border border-gray-700 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-twilight text-white py-2 rounded-lg border border-gray-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </div>
    </main>
  );
}
