import { Suspense } from "react";
import PayApp from "@/components/PayApp";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <PayApp />
    </Suspense>
  );
}
