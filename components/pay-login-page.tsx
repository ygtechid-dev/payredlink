"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { signInWithPopup } from "firebase/auth";
import { Wallet, Loader2, Mail, Lock, ArrowRight, Chrome } from "lucide-react";

export default function PayLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 🔹 LOGIN DENGAN GOOGLE
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const { uid, email, displayName, photoURL } = user;

      // 1️⃣ Simpan/update user di tabel users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .upsert(
          {
            firebase_uid: uid,
            email,
            display_name: displayName,
            photo_url: photoURL,
          },
          { onConflict: "firebase_uid" }
        )
        .select("id")
        .single();

      if (userError) throw userError;
      const userId = userData.id;

      // 2️⃣ Cek apakah sudah punya profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();

      // 3️⃣ Kalau belum ada profil → redirect ke register
      if (!profile) {
        localStorage.setItem("pendingUserID", userId);
        localStorage.setItem("email", email || "");
        localStorage.setItem("displayName", displayName || "");
        router.push("/register");
        return;
      }

      // 4️⃣ Kalau sudah ada profil → login success
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", profile.username);
      localStorage.setItem("user_id", userId);
      
      // Get Firebase token untuk SSO
      const token = await user.getIdToken();
      localStorage.setItem("auth_token", token);

      // Initialize user balance jika belum ada
      const { data: balanceCheck } = await supabase
        .from("user_balance")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!balanceCheck) {
        await supabase.from("user_balance").insert([
          {
            user_id: userId,
            current_balance: 0,
            last_updated: new Date().toISOString(),
          },
        ]);
      }

      alert("✅ Login berhasil! Selamat datang di PAY-RedLink!");
      router.push("/app");
    } catch (err) {
      console.error("❌ Google login failed:", err);
      alert("Login gagal: " + err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // 🔹 LOGIN MANUAL (Email/Password)
  const handleManualLogin = async () => {
    if (!email || !password) {
      alert("❌ Email dan password harus diisi!");
      return;
    }

    setLoading(true);
    try {
      // Cari user berdasarkan email atau username
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*, users:users!profiles_user_id_fkey(id, email, display_name)")
        .or(`username.eq.${email},users.email.eq.${email}`)
        .maybeSingle();

      if (error || !profile) {
        alert("❌ User tidak ditemukan!");
        setLoading(false);
        return;
      }

      // TODO: Implement password verification
      // Untuk demo, kita skip password check dulu
      // Di production, harus verify password hash

      // Login success
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", profile.username);
      localStorage.setItem("user_id", profile.users.id);

      // Initialize balance jika belum ada
      const { data: balanceCheck } = await supabase
        .from("user_balance")
        .select("id")
        .eq("user_id", profile.users.id)
        .maybeSingle();

      if (!balanceCheck) {
        await supabase.from("user_balance").insert([
          {
            user_id: profile.users.id,
            current_balance: 0,
            last_updated: new Date().toISOString(),
          },
        ]);
      }

      alert("✅ Login berhasil!");
      router.push("/app");
    } catch (err) {
      console.error("❌ Login error:", err);
      alert("Login gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-red-700 flex items-center justify-center p-6">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Wallet className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">PAY-RedLink</h1>
          <p className="text-white/80 text-lg">Digital Wallet Terpercaya</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Masuk ke Akun Kamu
          </h2>

          {/* Email/Username Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email atau Username
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-red-600 focus:outline-none transition"
                onKeyDown={(e) => e.key === "Enter" && handleManualLogin()}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-red-600 focus:outline-none transition"
                onKeyDown={(e) => e.key === "Enter" && handleManualLogin()}
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleManualLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">atau</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                Memproses...
              </>
            ) : (
              <>
                <img
                  src="https://www.svgrepo.com/show/355037/google.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Lanjutkan dengan Google
              </>
            )}
          </button>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-red-600 font-bold hover:underline"
              >
                Daftar Sekarang
              </button>
            </p>
          </div>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <button
              onClick={() => alert("Fitur reset password akan segera hadir!")}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Lupa password?
            </button>
          </div>
        </div>

        {/* Back to Landing */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-white/80 hover:text-white font-semibold text-sm transition"
          >
            ← Kembali ke Beranda
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-xs">
            Dengan masuk, kamu setuju dengan{" "}
            <a href="#" className="text-white underline">
              Syarat & Ketentuan
            </a>{" "}
            dan{" "}
            <a href="#" className="text-white underline">
              Kebijakan Privasi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}