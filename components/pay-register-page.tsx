"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { signInWithPopup } from "firebase/auth";
import { Wallet, Loader2, User, Mail, Phone, ArrowRight, Chrome } from "lucide-react";

export default function PayRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);


    useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `referral_code=${refCode}; expires=${expires.toUTCString()}; path=/`;
      localStorage.setItem('referral_code', refCode);
      console.log('✅ Referral code saved:', refCode);
    }
  }, [searchParams]);


   // 🔹 HELPER: Generate Referral Code
  const generateReferralCode = () => {
    return `REF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  };

  // 🔹 HELPER: Get Referrer User ID
  const getReferrerUserId = async (referralCode) => {
    if (!referralCode) return null;
    
    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", referralCode)
        .maybeSingle();
      
      return data?.user_id || null;
    } catch (err) {
      console.error("Error getting referrer:", err);
      return null;
    }
  };

  // 🔹 REGISTER DENGAN GOOGLE
  
  // 🔹 UPDATE handleGoogleRegister
  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const { uid, email, displayName, photoURL } = user;

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile) {
        alert("✅ Akun sudah terdaftar! Silakan login.");
        router.push("/login");
        return;
      }

      // 🎯 GET REFERRAL CODE FROM COOKIE
      const referralCodeFromCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('referral_code='))
        ?.split('=')[1] || localStorage.getItem('referral_code');

      const referrerUserId = await getReferrerUserId(referralCodeFromCookie);
      const userReferralCode = generateReferralCode();

      console.log('🔗 Referral Info:', {
        cookie: referralCodeFromCookie,
        referrerUserId,
        newCode: userReferralCode
      });

      localStorage.setItem("pendingUserID", userId);
      localStorage.setItem("email", email || "");
      localStorage.setItem("displayName", displayName || "");
      localStorage.setItem("photoURL", photoURL || "");
      localStorage.setItem("referrer_user_id", referrerUserId || "");
      localStorage.setItem("user_referral_code", userReferralCode);

      router.push("/register");
    } catch (err) {
      console.error("❌ Google login failed:", err);
      alert("Login gagal: " + err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  


  // 🔹 COMPLETE REGISTRATION
  const handleCompleteRegistration = async () => {
    const { username, displayName, phone } = formData;

    if (!username || !displayName) {
      alert("❌ Username dan nama lengkap harus diisi!");
      return;
    }

    // Validate username (alphanumeric, lowercase, no spaces)
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      alert("❌ Username hanya boleh huruf kecil, angka, dan underscore!");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      alert("❌ Username harus 3-20 karakter!");
      return;
    }

    setLoading(true);
    try {
      const pendingUserID = localStorage.getItem("pendingUserID");
      
      if (!pendingUserID) {
        alert("❌ Session expired. Silakan register ulang.");
        router.push("/register");
        return;
      }

      // Check username availability
      const { data: existingUsername } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (existingUsername) {
        alert("❌ Username sudah dipakai! Coba yang lain.");
        setLoading(false);
        return;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            user_id: pendingUserID,
            username,
            phone: phone || null,
            bio: "PAY-RedLink User",
            plan: "Free",
          },
        ]);

      if (profileError) throw profileError;

      // Initialize user balance
      await supabase.from("user_balance").insert([
        {
          user_id: pendingUserID,
          current_balance: 0,
          last_updated: new Date().toISOString(),
        },
      ]);

      // Save to localStorage
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", username);
      localStorage.setItem("user_id", pendingUserID);

      // Clear pending data
      localStorage.removeItem("pendingUserID");
      localStorage.removeItem("displayName");

      alert("✅ Registrasi berhasil! Selamat datang di PAY-RedLink!");
      router.push("/app");
    } catch (err) {
      console.error("❌ Registration error:", err);
      alert("Registrasi gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-red-700 flex items-center justify-center p-6">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Register Card */}
      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Wallet className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">PAY-RedLink</h1>
          <p className="text-white/80 text-lg">Mulai Transaksi Digital</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Buat Akun Baru
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Gratis selamanya, tanpa biaya bulanan
          </p>

          {/* Google Register */}
          <button
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="w-full border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
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
                Daftar dengan Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">atau lengkapi data</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="username"
                placeholder="contoh: yogikurniawan"
                value={formData.username}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-red-600 focus:outline-none transition lowercase"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Huruf kecil, angka, dan underscore. Min 3 karakter.
            </p>
          </div>

          {/* Display Name */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Lengkap <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="displayName"
                placeholder="Yogi Kurniawan"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-red-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-red-600 focus:outline-none transition"
                disabled={!!formData.email}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nomor HP (Opsional)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="08123456789"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-red-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Register Button */}
          <button
            onClick={handleCompleteRegistration}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Membuat Akun...
              </>
            ) : (
              <>
                Daftar Sekarang
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-red-600 font-bold hover:underline"
              >
                Masuk di sini
              </button>
            </p>
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
            Dengan mendaftar, kamu setuju dengan{" "}
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