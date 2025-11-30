// app/login/page.tsx
import PayLogin from "@/components/pay-login-page";

export const metadata = {
  title: "Login - PAY-RedLink",
  description: "Masuk ke akun PAY-RedLink kamu",
};

export default function LoginPage() {
  return <PayLogin />;
}