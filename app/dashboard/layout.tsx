import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import DashboardNavbar from "@/components/DashboardNavbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  let userRole: string;

  try {
    const { payload } = await jwtVerify(token, secret);
    userRole = payload.role as string;
  } catch (error) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <DashboardNavbar role={userRole} />
      <main className="p-8 w-full max-w-7xl mx-auto flex-1">
        {children}
      </main>
    </div>
  );
}