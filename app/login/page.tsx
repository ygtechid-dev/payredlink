// app/login/page.tsx
import PayLogin from "@/components/pay-login-page";
import { Suspense } from "react";

export const metadata = {
  title: "Login - PAY-RedLink",
  description: "Masuk ke akun PAY-RedLink kamu",
};

export default function LoginPage() {
  return(
 <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
        <PayLogin />
      </Suspense>
  )

     

}