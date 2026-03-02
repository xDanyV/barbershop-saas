import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return <div>No token found</div>;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);

    const role = payload.role as string;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {role === "BARBER" ? (
          <h1 className="text-3xl text-gray-500 font-bold">
            Welcome Barber Dashboard
          </h1>
        ) : (
          <h1 className="text-3xl font-bold">
            Welcome Customer Dashboard
          </h1>
        )}
      </div>
    );
  } catch {
    return <div>Invalid token</div>;
  }
}