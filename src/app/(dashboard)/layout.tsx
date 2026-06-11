import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
