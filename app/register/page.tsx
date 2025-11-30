// app/register/page.tsx
import PayRegister from "@/components/pay-register-page";

export const metadata = {
  title: "Daftar - PAY-RedLink",
  description: "Buat akun PAY-RedLink baru",
};

export default function RegisterPage() {
  return <PayRegister />;
}