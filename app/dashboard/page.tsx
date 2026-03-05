import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

type JWTPayload = {
  userId: string;
  role: "BARBER" | "CUSTOMER";
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);


  let user;
  //Do not use try catch for "redirect", it will cause hydration issues. Instead, we can use a simple if statement to check if the token is valid and redirect accordingly.
  try {
    const result = await jwtVerify(token, secret);
    user = result.payload;
  } catch {
    redirect("/login");
  }

  if (user.role === "BARBER") {
    redirect("/dashboard/barber");
  }

  if (user.role === "CUSTOMER") {
    redirect("/dashboard/customer");
  }

  redirect("/login");

}