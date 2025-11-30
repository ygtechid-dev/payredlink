"use client";
import { useState, useEffect } from "react";
import { usePayRedLinkSSO } from "@/hooks/usePayRedLinkSSO"; // ← Import SSO hook
import { supabase } from "@/lib/supabase";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  QrCode,
  ArrowDownToLine,
  Loader2,
  User,
  Home,
  History,
  Menu,
  LogOut,
  CheckCircle2,
} from "lucide-react";

export default function PayRedLinkApp() {
  // ✅ Use SSO hook
  const { loading: ssoLoading, authenticated } = usePayRedLinkSSO();

  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("home");
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  const [topUpAmount, setTopUpAmount] = useState("");
  const [creating, setCreating] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bank_name: "",
    account_number: "",
    account_holder: "",
  });
  const [withdrawing, setWithdrawing] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);

  useEffect(() => {
    // ✅ Tunggu SSO selesai
    if (ssoLoading) return;
    
    if (!authenticated) {
      // Kalau ga authenticated, SSO hook akan auto redirect ke /login
      return;
    }

    // ✅ Load data setelah authenticated
    const u = localStorage.getItem("username");
    const uid = localStorage.getItem("user_id");
    
    if (u && uid) {
      setUsername(u);
      setUserId(uid);
      fetchData(u, uid);
    }
  }, [ssoLoading, authenticated]);

  const fetchData = async (u, uid) => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, users:users!profiles_user_id_fkey(id, display_name, email, photo_url)")
        .eq("username", u)
        .maybeSingle();

      setProfile(profileData);

      const { data: balanceData } = await supabase
        .from("user_balance")
        .select("current_balance")
        .eq("user_id", uid)
        .maybeSingle();

      setBalance(balanceData?.current_balance || 0);

      const { data: txData } = await supabase
        .from("pay_transactions")
        .select("*")
        .eq("username", u)
        .order("created_at", { ascending: false })
        .limit(20);

      setTransactions(txData || []);

      const { data: wdData } = await supabase
        .from("pay_withdrawals")
        .select("*")
        .eq("username", u)
        .order("created_at", { ascending: false })
        .limit(20);

      setWithdrawals(wdData || []);

      const { data: historyData } = await supabase
        .from("pay_balance_history")
        .select("*")
        .eq("username", u)
        .order("created_at", { ascending: false })
        .limit(50);

      setBalanceHistory(historyData || []);
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const createTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) < 10000) {
      return alert("❌ Minimal top up Rp 10.000");
    }

    setCreating(true);
    try {
      const amount = parseFloat(topUpAmount);
      const orderId = `TOPUP-${userId}-${Date.now()}`;

      const response = await fetch("https://api.ditokoku.id/api/tripay/createRL", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "QRIS",
          amount,
          name: "Top Up PAY-RedLink",
          email: profile?.users?.email || `${username}@pay.redlink.id`,
          phone: profile?.phone || "08123456789",
          orderId,
        }),
      });

      const data = await response.json();

      if (!data?.checkout_url) {
        throw new Error("Gagal membuat transaksi");
      }

      await supabase.from("pay_transactions").insert([{
        user_id: userId,
        username,
        reference_id: orderId,
        tripay_reference: data.reference || orderId,
        amount,
        fee: data.fee || 0,
        total_amount: data.total_amount || amount,
        payment_method: "QRIS",
        payment_channel: "QRIS",
        qr_url: data.qr_url,
        qr_string: data.qr_string,
        status: "UNPAID",
        description: "Top up saldo",
        customer_name: username,
        customer_email: profile?.users?.email || `${username}@pay.redlink.id`,
        customer_phone: profile?.phone || "08123456789",
        tripay_response: data,
      }]);

      window.open(data.checkout_url, "_blank");
      alert("✅ Silakan selesaikan pembayaran di window baru!");

      setShowTopUpModal(false);
      setTopUpAmount("");
      
      setTimeout(() => fetchData(username, userId), 5000);
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Gagal: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const createWithdrawal = async () => {
    const { amount, bank_name, account_number, account_holder } = withdrawForm;

    if (!amount || !bank_name || !account_number || !account_holder) {
      return alert("❌ Lengkapi semua data!");
    }

    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount < 50000) return alert("❌ Minimal Rp 50.000");
    if (withdrawAmount > balance) return alert("❌ Saldo tidak cukup!");

    setWithdrawing(true);
    try {
      const adminFee = withdrawAmount * 0.025;
      const totalTransfer = withdrawAmount - adminFee;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      await supabase.from("pay_withdrawals").insert([{
        user_id: userId,
        username,
        amount: withdrawAmount,
        admin_fee: adminFee,
        total_transfer: totalTransfer,
        bank_name,
        account_number,
        account_holder,
        status: "PENDING",
        scheduled_date: tomorrow.toISOString().split("T")[0],
        is_auto: false,
      }]);

      alert(
        `✅ Permintaan berhasil!\n\n` +
        `Transfer: ${formatIDR(totalTransfer)}\n` +
        `Ke: ${bank_name} - ${account_number}\n` +
        `Waktu: Besok jam 14.00`
      );

      setShowWithdrawModal(false);
      setWithdrawForm({ amount: "", bank_name: "", account_number: "", account_holder: "" });
      fetchData(username, userId);
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Gagal: " + err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Yakin mau logout?")) {
      localStorage.removeItem("username");
      localStorage.removeItem("user_id");
      localStorage.removeItem("auth_token");
      window.location.href = "/";
    }
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (status) => {
    const badges = {
      PAID: <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">✓ Berhasil</span>,
      UNPAID: <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">⏳ Pending</span>,
      EXPIRED: <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">⊗ Expired</span>,
      PENDING: <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">⏳ Pending</span>,
      PROCESSING: <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">↻ Proses</span>,
      SUCCESS: <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">✓ Sukses</span>,
      FAILED: <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">✗ Gagal</span>,
    };
    return badges[status] || <span className="text-xs text-gray-500">{status}</span>;
  };

  // ✅ Show loading saat SSO atau fetching data
  if (ssoLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-orange-600">
        <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
        <p className="text-white font-semibold">
          {ssoLoading ? "Authenticating..." : "Loading..."}
        </p>
      </div>
    );
  }

  // Rest of the component sama seperti sebelumnya...
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-xs text-white/80">Halo,</p>
              <p className="font-bold">{profile?.users?.display_name || username}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="hover:bg-white/10 p-2 rounded-lg transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-6 -mt-6 mb-6">
        <div className="bg-gradient-to-br from-red-700 via-red-600 to-orange-600 rounded-3xl p-6 text-white shadow-2xl">
          <p className="text-white/80 text-sm mb-2">Saldo Kamu</p>
          <h1 className="text-4xl font-black mb-6">{formatIDR(balance)}</h1>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="font-bold text-sm">Top Up</span>
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={balance < 50000}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <ArrowDownToLine className="w-6 h-6" />
              <span className="font-bold text-sm">Tarik</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {activeTab === "home" && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Transaksi Terakhir</h3>
            <div className="space-y-2">
              {balanceHistory.slice(0, 5).map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.type === "CREDIT" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {item.type === "CREDIT" ? (
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <p className={`font-bold ${item.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                    {item.type === "CREDIT" ? "+" : "-"}{formatIDR(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50 shadow-2xl">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 ${activeTab === "home" ? "text-red-600" : "text-gray-400"}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-semibold">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center gap-1 ${activeTab === "history" ? "text-red-600" : "text-gray-400"}`}
          >
            <History className="w-6 h-6" />
            <span className="text-xs font-semibold">Riwayat</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 ${activeTab === "profile" ? "text-red-600" : "text-gray-400"}`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-semibold">Profil</span>
          </button>
        </div>
      </div>

      {/* Modals - sama seperti sebelumnya */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 pb-8 animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Top Up Saldo</h2>
            <p className="text-sm text-gray-600 mb-6">Minimal top up Rp 10.000</p>
            
            <input
              type="number"
              placeholder="Masukkan jumlah"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold mb-6 focus:border-red-600 focus:outline-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  setTopUpAmount("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold"
              >
                Batal
              </button>
              <button
                onClick={createTopUp}
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                {creating ? "Loading..." : "Bayar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 pb-8 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Tarik Dana</h2>
            <p className="text-sm text-gray-600 mb-6">Minimal Rp 50.000 • H+1 jam 14.00</p>
            
            <div className="space-y-4 mb-6">
              <input
                type="number"
                placeholder="Jumlah penarikan"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:border-red-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Nama Bank (BCA, Mandiri, dll)"
                value={withdrawForm.bank_name}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:border-red-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Nomor Rekening"
                value={withdrawForm.account_number}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:border-red-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Nama Pemilik Rekening"
                value={withdrawForm.account_holder}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, account_holder: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:border-red-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawForm({ amount: "", bank_name: "", account_number: "", account_holder: "" });
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold"
              >
                Batal
              </button>
              <button
                onClick={createWithdrawal}
                disabled={withdrawing}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {withdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {withdrawing ? "Loading..." : "Ajukan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}