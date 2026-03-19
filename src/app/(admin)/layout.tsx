import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[var(--admin-bg)]">
      <AdminSidebar user={session.user} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {children}
      </main>
    </div>
  );
}
