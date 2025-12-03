"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  QrCode,
  ArrowDownToLine,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Menu,
  User,
  LogOut,
  Settings,
  Home,
  History,
  X,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { usePayRedLinkSSO } from "@/hooks/usePayRedLinkSSO";

// ========== HELPER FORMAT ==========
const formatIDR = (num) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);

export default function PayRedLinkApp() {
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const { loading } = usePayRedLinkSSO();

  const [activeTab, setActiveTab] = useState("home");
  const [historyFilter, setHistoryFilter] = useState("all");

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const [topUpAmount, setTopUpAmount] = useState("");
  const [creating, setCreating] = useState(false);

  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bank_name: "",
    account_number: "",
    account_holder: "",
  });

  const [withdrawing, setWithdrawing] = useState(false);

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ========== LOAD USER ==========
  useEffect(() => {
    const u = localStorage.getItem("username");
    const uid = localStorage.getItem("user_id");

    if (!u || !uid) {
      setLoadingData(false);
      return;
    }

    setUsername(u);
    setUserId(uid);
    fetchData(uid);
  }, []);

  // ========== FETCH ALL DATA ==========
  const fetchData = async (uid) => {
    setLoadingData(true);
    try {
      const { data: p } = await supabase
        .from("profiles")
        .select("*, users:users!profiles_user_id_fkey(id,display_name,email,photo_url)")
        .eq("user_id", uid)
        .maybeSingle();
      setProfile(p);

      const { data: bal } = await supabase
        .from("user_balance")
        .select("current_balance")
        .eq("user_id", uid)
        .maybeSingle();
      setBalance(bal?.current_balance || 0);

      const { data: tx } = await supabase
        .from("pay_transactions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      setTransactions(tx || []);

      const { data: wd } = await supabase
        .from("pay_withdrawals")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      setWithdrawals(wd || []);

      const { data: hist } = await supabase
        .from("pay_balance_history")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      const combinedHistory = [
        ...(hist || []).map(h => ({
          id: `hist-${h.id}`,
          created_at: h.created_at,
          type: h.type,
          amount: h.amount,
          description: h.description,
          balance_after: h.balance_after,
          status: 'SUCCESS',
          source: 'history'
        })),
        
        ...(tx || []).map(t => ({
          id: `tx-${t.id}`,
          created_at: t.created_at,
          type: 'CREDIT',
          amount: t.amount,
          description: t.status === 'PAID' 
            ? `Top up via ${t.payment_method}` 
            : `Top up ${t.status.toLowerCase()} via ${t.payment_method}`,
          balance_after: null,
          status: t.status,
          source: 'topup',
          payment_method: t.payment_method,
          tripay_reference: t.tripay_reference
        })),
        
        ...(wd || []).map(w => ({
          id: `wd-${w.id}`,
          created_at: w.created_at,
          type: 'DEBIT',
          amount: w.amount,
          description: `Penarikan ke ${w.bank_name} - ${w.account_number}`,
          balance_after: null,
          status: w.status,
          source: 'withdraw',
          bank_name: w.bank_name,
          scheduled_date: w.scheduled_date
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setBalanceHistory(combinedHistory);
    } catch (err) {
      console.log("ERR FETCH:", err);
    }
    setLoadingData(false);
  };

  // ========== CREATE TOP UP (WITH 0.7% FEE) ==========
  const createTopUp = async () => {
    const inputAmount = parseFloat(topUpAmount);
    
    if (!topUpAmount || inputAmount < 1000) {
      return alert("Minimal top up adalah Rp 10.000");
    }

    // 💰 CALCULATE 0.7% FEE
    const fee = Math.ceil(inputAmount * 0.007); // 0.7% fee, rounded up
    const totalAmount = inputAmount + fee;

    setCreating(true);

    try {
      const orderId = `TOPUP-${userId}-${Date.now()}`;

      // CALL TRIPAY API with TOTAL AMOUNT (including fee)
      const response = await fetch(`https://api.ditokoku.id/api/tripay/createRL`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "QRIS",
          amount: totalAmount, // User pays totalAmount
          name: "Top Up PAY-RedLink",
          email: profile?.users?.email || `${username}@pay.redlink.id`,
          phone: profile?.phone || "08123456789",
          orderId,
        }),
      });

      const data = await response.json();
      console.log('====================================');
      console.log('dataa', data);
      console.log('====================================');
      if (!data?.qr_url) {
        throw new Error("Gagal membuat QR Code");
      }

      // INSERT TRANSACTION (amount = what user gets, total_amount = what user pays)
      const { error: err1 } = await supabase.from("pay_transactions").insert([
        {
          user_id: userId,
          username,
          reference_id: orderId,
          tripay_reference: data.reference || orderId,
          amount: inputAmount, // Amount user will receive
          fee: fee, // 0.7% fee
          total_amount: totalAmount, // Total user must pay
          payment_method: "QRIS",
          payment_channel: "QRIS",
          qr_url: data.qr_url,
          qr_string: data.qr_string,
          status: "UNPAID",
          description: "Top up saldo PAY-RedLink",
          customer_name: username,
          customer_email: profile?.users?.email,
          customer_phone: profile?.phone,
          tripay_response: data,
        }
      ]);

      if (err1) throw err1;

      // SHOW QR CODE MODAL
      setQrData({
        qr_url: data.qr_url,
        qr_string: data.qr_string,
        amount: totalAmount, // Show total to pay
        amountReceived: inputAmount, // Show what they'll receive
        fee: fee,
        reference: data.reference || orderId,
        checkout_url: data.checkout_url,
        expired_time: data.expired_time || null,
      });

      setShowTopUpModal(false);
      setShowQRModal(true);
      setTopUpAmount("");

      startPaymentCheck(data.reference || orderId);

    } catch (err) {
      console.error("TOPUP ERROR:", err);
      alert(err.message);
    }

    setCreating(false);
  };

  // ========== AUTO CHECK PAYMENT STATUS ==========
  const startPaymentCheck = (reference) => {
    const checkInterval = setInterval(async () => {
      try {
        const { data: tx } = await supabase
          .from("pay_transactions")
          .select("status")
          .eq("tripay_reference", reference)
          .single();

        if (tx?.status === "PAID") {
          clearInterval(checkInterval);
          setShowQRModal(false);
          setQrData(null);
          alert("✅ Pembayaran berhasil! Saldo sudah masuk.");
          fetchData(userId);
        }
      } catch (err) {
        console.log("Check payment error:", err);
      }
    }, 5000);

    setTimeout(() => clearInterval(checkInterval), 3600000);
  };

  // ========== MANUAL CHECK PAYMENT ==========
const checkPaymentStatus = async () => {
  if (!qrData?.reference) return;

  setCheckingPayment(true);

  try {
    const res = await fetch(`https://api.tomassage.id/api/tripay/check-transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: qrData.reference })
    });

    const data = await res.json();
    console.log("CHECK RESULT:", data);

    if (data.success && data.message === "Balance updated") {
      // SALDO MASUK
      setShowQRModal(false);
      setQrData(null);
      alert("🎉 Pembayaran berhasil! Saldo sudah masuk.");
      fetchData(userId);
    } 
    else if (data.success && data.message === "Already processed") {
      setShowQRModal(false);
      setQrData(null);
      alert("🎉 Sudah diproses sebelumnya.");
      fetchData(userId);
    }
    else if (data.success && data.status === "PAID") {
      alert("✔ Sudah dibayar tetapi saldo belum diproses.");
    }
    else {
      alert("⏳ Pembayaran belum diterima.");
    }

  } catch (err) {
    console.error("CHECK ERROR:", err);
    alert("Gagal cek pembayaran.");
  }

  setCheckingPayment(false);
};


  // ========== COPY QR STRING ==========
  const copyQRString = () => {
    if (qrData?.qr_string) {
      navigator.clipboard.writeText(qrData.qr_string);
      alert("✅ QR String berhasil disalin!");
    }
  };

  // ========== CREATE WITHDRAWAL (WITH Rp 3K + Rp 3K FOR NON-MANDIRI/BCA) ==========
 // ========== CREATE WITHDRAWAL (WITH FEE DISTRIBUTION) ==========
const createWithdrawal = async () => {
  const { amount, bank_name, account_number, account_holder } = withdrawForm;

  if (!amount || !bank_name || !account_number || !account_holder) {
    return alert("Lengkapi semua form penarikan");
  }

  const withdrawAmount = parseFloat(amount);

  if (withdrawAmount < 50000)
    return alert("Minimal tarik dana Rp 50.000");

  if (withdrawAmount > balance)
    return alert("Saldo tidak cukup");

  setWithdrawing(true);

  try {
    // 💰 CALCULATE FEES
    const baseFee = 3000;
    const bankUpper = bank_name.toUpperCase();
    const isMandiriOrBCA = bankUpper.includes("MANDIRI") || bankUpper.includes("BCA");
    const extraFee = isMandiriOrBCA ? 0 : 3000;
    const totalAdminFee = baseFee + extraFee;
    const totalTransfer = withdrawAmount - totalAdminFee;

    if (totalTransfer <= 0) {
      return alert(`Saldo tidak cukup!\nBiaya admin: ${formatIDR(totalAdminFee)}`);
    }

    // 1️⃣ GET REFERRER INFO
    const { data: profileData } = await supabase
      .from("profiles")
      .select("referrer_user_id, username")
      .eq("user_id", userId)
      .single();

    const referrerUserId = profileData?.referrer_user_id;
    const currentUsername = profileData?.username;

    // 2️⃣ CALCULATE FEE DISTRIBUTION
    let referralAmount = 0;
    let platformAmount = 0;

    if (referrerUserId) {
      referralAmount = 2000;
      platformAmount = Math.max(0, totalAdminFee - referralAmount);
    } else {
      platformAmount = totalAdminFee;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    // 3️⃣ INSERT WITHDRAWAL
    const { data: newWithdrawal, error: err1 } = await supabase
      .from("pay_withdrawals")
      .insert([
        {
          user_id: userId,
          username,
          amount: withdrawAmount,
          admin_fee: totalAdminFee,
          total_transfer: totalTransfer,
          bank_name,
          account_number,
          account_holder,
          status: "PENDING",
          scheduled_date: tomorrow.toISOString(),
          is_auto: false,
        }
      ])
      .select()
      .single();

    if (err1) throw err1;

    // 4️⃣ DISTRIBUTE FEE TO REFERRER (jika ada)
    if (referrerUserId && referralAmount > 0) {
      // Get referrer balance
      const { data: refBalance } = await supabase
        .from("user_balance")
        .select("current_balance")
        .eq("user_id", referrerUserId)
        .maybeSingle();

      if (!refBalance) {
        // Create balance if not exists
        await supabase.from("user_balance").insert([{
          user_id: referrerUserId,
          current_balance: referralAmount
        }]);
      } else {
        const oldBalance = refBalance.current_balance || 0;
        const newBalance = oldBalance + referralAmount;

        // Update referrer balance
        await supabase
          .from("user_balance")
          .update({
            current_balance: newBalance,
            last_updated: new Date().toISOString()
          })
          .eq("user_id", referrerUserId);

        // Record balance history untuk referrer
        await supabase.from("pay_balance_history").insert([{
          user_id: referrerUserId,
          type: "CREDIT",
          amount: referralAmount,
          balance_before: oldBalance,
          balance_after: newBalance,
          description: `Komisi referral dari penarikan @${currentUsername}`,
          reference_id: newWithdrawal.id,
          reference_type: "WITHDRAWAL_REFERRAL"
        }]);
      }

      // Record referral earning
      await supabase.from("referral_earnings").insert([{
        referrer_user_id: referrerUserId,
        referred_user_id: userId,
        withdrawal_id: newWithdrawal.id,
        amount: referralAmount,
        type: "REFERRAL",
        description: `Komisi referral dari penarikan @${currentUsername}`
      }]);
    }

    // 5️⃣ DISTRIBUTE FEE TO PLATFORM
    if (platformAmount > 0) {
      // Get platform balance
      const { data: platformBalance } = await supabase
        .from("balance_redlink")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const oldPlatformBalance = platformBalance?.current_balance || 0;
      const newPlatformBalance = oldPlatformBalance + platformAmount;
      const totalEarned = (platformBalance?.total_earned || 0) + platformAmount;

      if (platformBalance) {
        // Update existing
        await supabase
          .from("balance_redlink")
          .update({
            current_balance: newPlatformBalance,
            total_earned: totalEarned,
            last_updated: new Date().toISOString()
          })
          .eq("id", platformBalance.id);
      } else {
        // Create new
        await supabase.from("balance_redlink").insert([{
          current_balance: platformAmount,
          total_earned: platformAmount
        }]);
      }

      // Record platform earning
      await supabase.from("referral_earnings").insert([{
        referred_user_id: userId,
        withdrawal_id: newWithdrawal.id,
        amount: platformAmount,
        type: "PLATFORM",
        description: `Fee platform dari penarikan @${currentUsername}`
      }]);
    }

    // 📱 SEND WHATSAPP NOTIFICATION
    try {
      const waMessage = `🔔 *PENARIKAN DANA BARU*\n\n` +
        `Jumlah: ${formatIDR(withdrawAmount)}\n` +
        `Biaya Admin: ${formatIDR(totalAdminFee)}\n` +
        (extraFee > 0 ? `  - Biaya dasar: ${formatIDR(baseFee)}\n  - Biaya bank lain: ${formatIDR(extraFee)}\n` : `  - Biaya dasar: ${formatIDR(baseFee)}\n`) +
        `Transfer: ${formatIDR(totalTransfer)}\n\n` +
        `*DETAIL REKENING:*\n` +
        `Bank: ${bank_name}\n` +
        `No Rek: ${account_number}\n` +
        `A/N: ${account_holder}\n\n` +
        `*USER INFO:*\n` +
        `Username: ${username}\n` +
        `Email: ${profile?.users?.email || '-'}\n` +
        `Phone: ${profile?.phone || '-'}\n\n` +
        `*FEE DISTRIBUTION:*\n` +
        (referrerUserId ? `  - Referral: ${formatIDR(referralAmount)}\n` : '') +
        `  - Platform: ${formatIDR(platformAmount)}\n\n` +
        `⏰ Jadwal: ${tomorrow.toLocaleString('id-ID')}`;

      const waRes = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "ScSuD6CbrZakniT79zut",
        },
        body: JSON.stringify({
          target: "085121158088",
          message: waMessage,
        }),
      });
      
      if (waRes.ok) {
        console.log("✅ WhatsApp notification sent");
      }
    } catch (waErr) {
      console.error("❌ WA Error:", waErr);
    }

    alert(
      `✅ Permintaan penarikan berhasil!\n\n` +
      `Jumlah: ${formatIDR(withdrawAmount)}\n` +
      `Biaya Admin: ${formatIDR(totalAdminFee)}\n` +
      (extraFee > 0 ? `  • Biaya dasar: ${formatIDR(baseFee)}\n  • Biaya bank lain: ${formatIDR(extraFee)}\n` : '') +
      `Transfer: ${formatIDR(totalTransfer)}\n\n` +
      `Bank: ${bank_name}\n` +
      `Rekening: ${account_number}\n` +
      `A/N: ${account_holder}\n\n` +
      (referrerUserId ? `💰 Referral bonus: ${formatIDR(referralAmount)} telah dikirim\n` : '') +
      `⏰ Diproses besok jam 14.00`
    );

    setShowWithdrawModal(false);
    setWithdrawForm({
      amount: "",
      bank_name: "",
      account_number: "",
      account_holder: "",
    });

    fetchData(userId);

  } catch (err) {
    console.error("WITHDRAW ERROR:", err);
    alert(err.message);
  }

  setWithdrawing(false);
};

  // ========== CALCULATE WITHDRAWAL FEE PREVIEW ==========
  const getWithdrawalFeePreview = () => {
    const amount = parseFloat(withdrawForm.amount) || 0;
    if (amount === 0) return null;

    const baseFee = 3000;
    const bankUpper = withdrawForm.bank_name.toUpperCase();
    const isMandiriOrBCA = bankUpper.includes("MANDIRI") || bankUpper.includes("BCA");
    const extraFee = isMandiriOrBCA ? 0 : 3000;
    const totalFee = baseFee + extraFee;
    const transfer = amount - totalFee;

    return { baseFee, extraFee, totalFee, transfer, isMandiriOrBCA };
  };

  // ========== UI HOME ==========
  const HomeUI = () => (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">
            {transactions.filter(t => t.status === "PAID").length}
          </p>
          <p className="text-xs text-gray-600">Top Up</p>
        </div>

        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">
            {withdrawals.filter(w => w.status === "SUCCESS").length}
          </p>
          <p className="text-xs text-gray-600">Penarikan</p>
        </div>

        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-purple-600">
            {balanceHistory.length}
          </p>
          <p className="text-xs text-gray-600">Transaksi</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center justify-between">
          <span>Transaksi Terakhir</span>
          <button onClick={() => setActiveTab("history")} className="text-sm text-red-600">
            Lihat Semua
          </button>
        </h3>

        <div className="space-y-2">
          {balanceHistory.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">Belum ada riwayat transaksi.</p>
          )}

          {balanceHistory.slice(0, 5).map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center">
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

              <div className="flex flex-col items-end gap-1">
                <p className={`font-bold ${
                  item.type === "CREDIT" ? "text-green-600" : "text-red-600"
                }`}>
                  {item.type === "CREDIT" ? "+" : "-"} {formatIDR(item.amount)}
                </p>
                {item.status && item.status !== 'SUCCESS' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    item.status === 'UNPAID' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-orange-600">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* TOP BAR */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="Avatar" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-xs text-white/80">Halo,</p>
              <p className="font-bold">{profile?.users?.display_name || username}</p>
            </div>
          </div>

          <Menu className="w-6 h-6" />
        </div>
      </div>

      {/* SALDO CARD */}
      <div className="px-6 -mt-6 mb-6">
        <div className="bg-gradient-to-br from-red-700 via-red-600 to-orange-600 rounded-3xl p-6 text-white shadow-2xl">
          <p className="text-white/80 text-sm">Saldo Kamu</p>
          <h1 className="text-4xl font-black my-3">{formatIDR(balance)}</h1>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95">
              <TrendingUp className="w-6 h-6" />
              <span className="font-bold text-sm">Top Up</span>
            </button>

            <button
              disabled={balance < 10000}
              onClick={() => setShowWithdrawModal(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
              <ArrowDownToLine className="w-6 h-6" />
              <span className="font-bold text-sm">Tarik Dana</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-6">
        {activeTab === "home" && <HomeUI />}

        {activeTab === "history" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Riwayat Transaksi</h2>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button 
                onClick={() => setHistoryFilter("all")}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                  historyFilter === "all" 
                    ? "bg-red-600 text-white" 
                    : "bg-white text-gray-700"
                }`}>
                Semua ({balanceHistory.length})
              </button>
              <button 
                onClick={() => setHistoryFilter("topup")}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                  historyFilter === "topup" 
                    ? "bg-red-600 text-white" 
                    : "bg-white text-gray-700"
                }`}>
                Top Up ({balanceHistory.filter(h => h.source === 'topup').length})
              </button>
              <button 
                onClick={() => setHistoryFilter("withdraw")}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                  historyFilter === "withdraw" 
                    ? "bg-red-600 text-white" 
                    : "bg-white text-gray-700"
                }`}>
                Penarikan ({balanceHistory.filter(h => h.source === 'withdraw').length})
              </button>
            </div>

            {balanceHistory.filter(item => {
              if (historyFilter === "all") return true;
              return item.source === historyFilter;
            }).length === 0 && (
              <p className="text-center text-gray-500 py-8">Belum ada riwayat transaksi.</p>
            )}

            <div className="space-y-3">
              {balanceHistory.filter(item => {
                if (historyFilter === "all") return true;
                return item.source === historyFilter;
              }).map((item) => {
                const getStatusBadge = (status) => {
                  const badges = {
                    'PAID': 'bg-green-100 text-green-700',
                    'SUCCESS': 'bg-green-100 text-green-700',
                    'UNPAID': 'bg-yellow-100 text-yellow-700',
                    'PENDING': 'bg-blue-100 text-blue-700',
                    'EXPIRED': 'bg-gray-100 text-gray-700',
                    'FAILED': 'bg-red-100 text-red-700',
                    'CANCELLED': 'bg-red-100 text-red-700'
                  };
                  return badges[status] || 'bg-gray-100 text-gray-700';
                };

                return (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.type === "CREDIT" ? "bg-green-100" : "bg-red-100"
                        }`}>
                          {item.type === "CREDIT" ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">{item.description}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(item.created_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <p className={`font-bold ${
                          item.type === "CREDIT" ? "text-green-600" : "text-red-600"
                        }`}>
                          {item.type === "CREDIT" ? "+" : "-"} {formatIDR(item.amount)}
                        </p>
                        
                        {item.status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.balance_after && (
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 mt-2">
                        Saldo setelah transaksi: <b>{formatIDR(item.balance_after)}</b>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
{activeTab === "profile" && (
  <div>
    <h2 className="text-2xl font-bold mb-6">Profil Saya</h2>

    {/* REFERRAL SECTION */}
    <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl p-6 shadow-xl mb-4 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Program Referral</h3>
          <p className="text-white/80 text-sm">Ajak teman, dapat bonus!</p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-3">
        <p className="text-white/80 text-xs mb-2">Link Referral Kamu</p>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/login?ref=${profile?.referral_code || ''}`}
            readOnly
            className="flex-1 bg-white/20 backdrop-blur text-white rounded-xl px-3 py-2 text-sm font-mono"
          />
          <button 
            onClick={() => {
              const link = `${window.location.origin}/login?ref=${profile?.referral_code}`;
              navigator.clipboard.writeText(link);
              alert('✅ Link referral disalin!');
            }}
            className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2 rounded-xl transition-all active:scale-95">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
        <p className="text-sm font-semibold mb-2">💰 Cara Dapat Bonus:</p>
        <ul className="text-sm space-y-1 text-white/90">
          <li>• Share link referral ke teman</li>
          <li>• Teman daftar pakai link kamu</li>
          <li>• Setiap teman tarik dana, kamu dapat <b>Rp 2.000</b></li>
          <li>• Bonus langsung masuk ke saldo!</li>
        </ul>
      </div>
    </div>

    {/* PROFILE INFO */}
    <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-3xl font-bold">
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            profile?.users?.display_name?.charAt(0) || username?.charAt(0)?.toUpperCase()
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold">{profile?.users?.display_name || profile?.full_name}</h3>
          <p className="text-sm text-gray-600">{profile?.users?.email}</p>
          <p className="text-xs text-gray-400">@{username}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Nomor HP</span>
          <span className="font-semibold">{profile?.phone || "-"}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Kode Referral</span>
          <span className="font-semibold font-mono text-purple-600">
            {profile?.referral_code || "-"}
          </span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Status Akun</span>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
            Verified
          </span>
        </div>

        <div className="flex justify-between py-3">
          <span className="text-gray-600">Bergabung</span>
          <span className="font-semibold">
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("id-ID") : '-'}
          </span>
        </div>
      </div>
    </div>

    {/* LOGOUT BUTTON */}
    <button
      onClick={() => {
        localStorage.clear();
        location.href = "/";
      }}
      className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-95">
      <LogOut className="w-5 h-5" />
      Logout
    </button>
  </div>
)}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50 shadow-lg">
        <div className="flex items-center justify-around">
          <button onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center ${activeTab === "home" ? "text-red-600" : "text-gray-400"}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs font-semibold">Home</span>
          </button>

          <button onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center ${activeTab === "history" ? "text-red-600" : "text-gray-400"}`}>
            <History className="w-6 h-6" />
            <span className="text-xs font-semibold">Riwayat</span>
          </button>

          <button onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center ${activeTab === "profile" ? "text-red-600" : "text-gray-400"}`}>
            <User className="w-6 h-6" />
            <span className="text-xs font-semibold">Profil</span>
          </button>
        </div>
      </div>

      {/* ===== TOPUP MODAL ===== */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

            <h2 className="text-2xl text-gray-500 font-bold mb-2">Top Up Saldo</h2>
            <p className="text-sm text-gray-500 mb-4">Minimal top up Rp 10.000 • Biaya 0.7%</p>

            <input
  type="number"
  value={topUpAmount}
  onChange={(e) => setTopUpAmount(e.target.value)}
  placeholder="Masukkan jumlah"
  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 mb-3 text-lg font-bold text-black"
 />

            {/* Fee Preview */}
            {topUpAmount && parseFloat(topUpAmount) >= 10000 && (
              <div className="bg-blue-50 rounded-xl p-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Saldo yang didapat:</span>
                  <span className="font-bold">{formatIDR(parseFloat(topUpAmount))}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Biaya (0.7%):</span>
                  <span className="font-bold text-orange-600">
                    +{formatIDR(Math.ceil(parseFloat(topUpAmount) * 0.007))}
                  </span>
                </div>
                <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total Bayar:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {formatIDR(parseFloat(topUpAmount) + Math.ceil(parseFloat(topUpAmount) * 0.007))}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  setTopUpAmount("");
                }}
                className="flex-1 bg-gray-200 py-3 rounded-2xl font-bold">
                Batal
              </button>

              <button
                onClick={createTopUp}
                disabled={creating}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <QrCode className="w-5 h-5" />
                )}
                {creating ? "Membuat..." : "Lanjut"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== QR CODE MODAL ===== */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Scan QR Code</h2>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setQrData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 mb-4">
              <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                <img
                  src={qrData.qr_url}
                  alt="QR Code"
                  className="w-full h-auto"
                />
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                <p className="text-3xl font-black text-gray-900">
                  {formatIDR(qrData.amount)}
                </p>
                {qrData.fee > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Saldo diterima: {formatIDR(qrData.amountReceived)} • Biaya: {formatIDR(qrData.fee)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Ref: {qrData.reference}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                📱 Cara Bayar:
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Buka aplikasi e-wallet atau mobile banking</li>
                <li>Pilih menu Scan QR / QRIS</li>
                <li>Scan kode QR di atas</li>
                <li>Konfirmasi pembayaran</li>
              </ol>
            </div>

            <div className="space-y-2">
              <button
                onClick={checkPaymentStatus}
                disabled={checkingPayment}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition">
                {checkingPayment ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {checkingPayment ? "Mengecek..." : "Cek Status Pembayaran"}
              </button>

              <button
                onClick={copyQRString}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition">
                <Copy className="w-4 h-4" />
                Salin QR String
              </button>

              {qrData.checkout_url && (
                <button
                  onClick={() => window.open(qrData.checkout_url, "_blank")}
                  className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition">
                  <ExternalLink className="w-4 h-4" />
                  Buka Halaman Pembayaran
                </button>
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Status pembayaran dicek otomatis setiap 5 detik
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== WITHDRAW MODAL ===== */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

            <h2 className="text-xl font-bold">Tarik Dana</h2>
            <p className="text-sm text-gray-500 mb-6">
              Minimal Rp 10.000 • Diproses H+1 jam 14.00
            </p>

            {/* Fee Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Biaya Penarikan:</p>
                <p>• Rp 3.000 (biaya dasar)</p>
                <p>• Rp 3.000 tambahan untuk bank selain Mandiri/BCA</p>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <input
                type="number"
                placeholder="Jumlah penarikan"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="Nama Bank (contoh: BCA, Mandiri, BRI)"
                value={withdrawForm.bank_name}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="Nomor Rekening"
                value={withdrawForm.account_number}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="Nama Pemilik Rekening"
                value={withdrawForm.account_holder}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, account_holder: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3"
              />
            </div>

            {/* Fee Preview */}
            {(() => {
              const preview = getWithdrawalFeePreview();
              if (!preview || preview.transfer <= 0) return null;

              return (
                <div className="bg-blue-50 rounded-xl p-3 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Jumlah penarikan:</span>
                    <span className="font-bold">{formatIDR(parseFloat(withdrawForm.amount))}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Biaya admin:</span>
                    <span className="font-bold text-red-600">
                      -{formatIDR(preview.totalFee)}
                    </span>
                  </div>
                  {preview.extraFee > 0 && (
                    <p className="text-xs text-gray-500 ml-4 mb-1">
                      • Biaya dasar: {formatIDR(preview.baseFee)}<br/>
                      • Bank lain: {formatIDR(preview.extraFee)}
                    </p>
                  )}
                  <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Akan ditransfer:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatIDR(preview.transfer)}
                    </span>
                  </div>
                  {preview.isMandiriOrBCA && (
                    <p className="text-xs text-green-600 mt-2">✓ Bank Mandiri/BCA - Tanpa biaya tambahan</p>
                  )}
                </div>
              );
            })()}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawForm({ amount: "", bank_name: "", account_number: "", account_holder: "" });
                }}
                className="flex-1 bg-gray-200 py-3 rounded-2xl font-bold">
                Batal
              </button>

              <button
                onClick={createWithdrawal}
                disabled={withdrawing}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {withdrawing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {withdrawing ? "Memproses..." : "Ajukan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANIMATIONS */}
      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scale-up {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}