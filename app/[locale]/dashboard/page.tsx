import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

type JWTPayload = {
  userId: string;
  role: "CUSTOMER" | "BARBER" | "OWNER" | "ADMIN";
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  let user: JWTPayload;

  try {
    const result = await jwtVerify(token, secret);
    user = result.payload as JWTPayload;
  } catch {
    redirect("/login");
  }

  if (user.role === "CUSTOMER") {
    redirect("/dashboard/customer");
  }

  if (user.role === "BARBER") {
    redirect("/dashboard/barber");
  }

  if (user.role === "OWNER" || user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  redirect("/login");
}