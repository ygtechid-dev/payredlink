// hooks/usePayRedLinkSSO.ts
// Hook ini dipakai di PAY-RedLink (pay.redlink.id)

"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function usePayRedLinkSSO() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    handleSSO();
  }, []);

  const handleSSO = async () => {
    try {
      // Check apakah ada SSO params dari RedLink
      const username = searchParams.get("username");
      const userId = searchParams.get("user_id");
      const token = searchParams.get("token");

      console.log("🔐 SSO Params:", { username, userId, hasToken: !!token });

      // Jika ada SSO params dari RedLink
      if (username && userId) {
        // Verify user exists di database
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*, users:users!profiles_user_id_fkey(id, display_name, email)")
          .eq("username", username)
          .eq("users.id", userId)
          .maybeSingle();

        if (error || !profile) {
          console.error("❌ User not found:", error);
          alert("User tidak ditemukan. Silakan login manual.");
          router.push("/login");
          setLoading(false);
          return;
        }

        // Save to localStorage untuk session PAY-RedLink
        localStorage.setItem("username", username);
        localStorage.setItem("user_id", userId);
        
        if (token) {
          localStorage.setItem("auth_token", token);
        }

        console.log("✅ SSO Success! User:", username);
        
        // Set authenticated
        setAuthenticated(true);
        
        // Remove query params dari URL (clean URL)
        const cleanUrl = new URL(window.location.href);
        cleanUrl.search = "";
        window.history.replaceState({}, "", cleanUrl.toString());
        
        setLoading(false);
        return;
      }

      // Jika tidak ada SSO params, cek localStorage biasa
      const storedUsername = localStorage.getItem("username");
      const storedUserId = localStorage.getItem("user_id");

      if (storedUsername && storedUserId) {
        console.log("✅ Already authenticated from localStorage");
        setAuthenticated(true);
        setLoading(false);
        return;
      }

      // Tidak ada auth sama sekali, redirect ke login
      console.log("❌ No authentication found");
      router.push("/login");
      setLoading(false);

    } catch (error) {
      console.error("❌ SSO Error:", error);
      router.push("/login");
      setLoading(false);
    }
  };

  return { loading, authenticated };
}