"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Smartphone,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Wallet,
  CreditCard,
  Star,
  Globe,
} from "lucide-react";

export default function PayRedLinkLanding() {
  const router = useRouter();

  const features = [
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "QRIS Payment",
      description: "Top up instan dengan scan QRIS dari berbagai bank & e-wallet",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Super Cepat",
      description: "Saldo masuk otomatis dalam hitungan detik setelah pembayaran",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Tarik Dana Mudah",
      description: "Withdraw ke rekening bank manapun, proses H+1 jam 14.00",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Aman & Terpercaya",
      description: "Dilindungi enkripsi bank-grade, data 100% aman",
      color: "from-purple-500 to-pink-500",
    },
  ];

  const stats = [
    { label: "Total Transaksi", value: "100K+", icon: <TrendingUp /> },
    { label: "Pengguna Aktif", value: "25K+", icon: <Users /> },
    { label: "Proses Cepat", value: "<1 Min", icon: <Clock /> },
    { label: "Success Rate", value: "99.9%", icon: <CheckCircle2 /> },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Daftar & Login",
      description: "Buat akun dengan email atau nomor WhatsApp kamu",
      icon: <Smartphone className="w-8 h-8" />,
    },
    {
      step: "2",
      title: "Top Up Saldo",
      description: "Isi saldo via QRIS, minimal hanya Rp 10.000",
      icon: <QrCode className="w-8 h-8" />,
    },
    {
      step: "3",
      title: "Bayar & Transfer",
      description: "Gunakan saldo untuk bayar atau transfer ke rekening",
      icon: <Wallet className="w-8 h-8" />,
    },
  ];

  const testimonials = [
    {
      name: "Rina Maharani",
      role: "Online Seller",
      avatar: "👩‍💼",
      text: "PAY-RedLink bikin terima pembayaran dari customer jadi super gampang! Ga perlu repot kasih nomor rekening lagi.",
      rating: 5,
    },
    {
      name: "Dimas Prasetyo",
      role: "Freelancer",
      avatar: "👨‍💻",
      text: "Top up cepat, tarik dana gampang. Fee-nya juga reasonable banget. Recommended!",
      rating: 5,
    },
    {
      name: "Siti Nurhaliza",
      role: "Content Creator",
      avatar: "🎨",
      text: "Terima payment dari brand collaboration langsung masuk saldo. Withdraw ke rekening juga cepet!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Mobile Style */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              PAY-RedLink
            </h1>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section - Mobile Style */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Digital Wallet #1 Indonesia
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              Digital Wallet
              <br />
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Serba Mudah
              </span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Top up instan, tarik dana cepat, bayar apapun dengan satu aplikasi
            </p>

            {/* Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative mx-auto max-w-xs mb-8"
            >
              <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-gray-50 px-6 py-3 flex items-center justify-between text-xs">
                    <span className="font-semibold">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-3 border border-gray-400 rounded-sm"></div>
                      <div className="w-1 h-3 bg-gray-400 rounded-sm"></div>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="bg-gradient-to-br from-red-600 to-orange-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white/80 text-xs mb-1">Saldo Kamu</p>
                        <h2 className="text-2xl font-bold">Rp 1.250.000</h2>
                      </div>
                      <Wallet className="w-8 h-8 text-white/80" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                        <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xs">Top Up</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                        <Wallet className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xs">Tarik</p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction List */}
                  <div className="p-4 space-y-2 bg-gray-50">
                    <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Top Up QRIS</p>
                          <p className="text-xs text-gray-500">01 Jan 2024</p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600">+Rp 500K</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Bayar Tagihan</p>
                          <p className="text-xs text-gray-500">31 Dec 2023</p>
                        </div>
                      </div>
                      <p className="font-bold text-red-600">-Rp 150K</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.button
              onClick={() => router.push("/register")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-red-500/50 transition-all inline-flex items-center gap-2"
            >
              Buat Akun Gratis
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <p className="text-xs text-gray-500 mt-4">
              Gratis selamanya • Tanpa biaya bulanan
            </p>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-200/30 to-red-200/30 rounded-full blur-3xl"></div>
      </section>

      {/* Stats - Mobile Optimized */}
      <section className="py-12 bg-white">
        <div className="max-w-md mx-auto px-6">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 text-white rounded-xl mx-auto mb-3 flex items-center justify-center">
                  {stat.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-xs text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Mobile Cards */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-black mb-3">
              Kenapa Pilih
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                {" "}
                PAY-RedLink?
              </span>
            </h2>
            <p className="text-gray-600">
              Fitur lengkap untuk semua kebutuhan transaksi digital kamu
            </p>
          </motion.div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${feature.color} text-white rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Mobile Timeline */}
      <section className="py-12 bg-white">
        <div className="max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-black mb-3">Cara Pakai</h2>
            <p className="text-gray-600">Mudah banget, cuma 3 langkah!</p>
          </motion.div>

          <div className="space-y-6">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-orange-600 text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg">
                      {item.step}
                    </div>
                    {index < howItWorks.length - 1 && (
                      <div className="w-0.5 h-16 bg-gradient-to-b from-red-600 to-orange-600 my-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pt-3">
                    <h3 className="font-bold text-xl mb-2 text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{item.description}</p>
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center text-gray-400">
                      {item.icon}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Mobile Carousel Style */}
      <section className="py-12 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-black mb-3">
              Kata Mereka
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                {" "}
                yang Sudah Pakai
              </span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Mobile Sticky Bottom Style */}
      <section className="py-16 bg-gradient-to-br from-red-600 via-orange-600 to-red-700 text-white">
        <div className="max-w-md mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-black mb-4">
              Siap Mulai Transaksi Digital?
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              Daftar sekarang dan dapatkan bonus saldo Rp 10.000!
            </p>

            <button
              onClick={() => router.push("/register")}
              className="w-full bg-white text-red-600 px-8 py-4 rounded-xl font-black text-lg shadow-2xl hover:shadow-white/50 transition-all mb-4"
            >
              Daftar Sekarang - GRATIS!
            </button>

            <p className="text-white/70 text-sm">
              Sudah punya akun?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-white font-semibold underline"
              >
                Login di sini
              </button>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer - Mobile Simple */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">PAY-RedLink</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Digital wallet terpercaya untuk semua kebutuhan transaksi kamu
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400 mb-4">
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
            <a href="#" className="hover:text-white transition">
              Help
            </a>
          </div>
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} PAY-RedLink by YG Tech
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}