import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import BarberDashboard from "./components/BarberDashboard";
import CustomerDashboard from "./components/CustomerDashboard";

type JWTPayload = {
  id: string;
  email: string;
  role: "BARBER" | "CUSTOMER";
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    const user = payload as JWTPayload;

    if (!user.role) {
      redirect("/login");
    }

    if (user.role === "BARBER") {
      return <BarberDashboard user={user} />;
    }

    return <CustomerDashboard user={user} />;
  } catch {
    redirect("/login");
  }
}