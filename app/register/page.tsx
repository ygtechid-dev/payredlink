// app/register/page.tsx
import PayRegister from "@/components/pay-register-page";
import { Suspense } from "react";

export const metadata = {
  title: "Daftar - PAY-RedLink",
  description: "Buat akun PAY-RedLink baru",
};

export default function RegisterPage() {
   return(
   <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
          <PayRegister />
        </Suspense>
    )
}