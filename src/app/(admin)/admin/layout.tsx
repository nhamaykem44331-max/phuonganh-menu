import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader user={session.user} />
      <div className="flex-1 overflow-y-auto bg-[var(--admin-bg)] p-6">
        {children}
      </div>
    </div>
  );
}