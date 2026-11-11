import type { ReactNode } from "react";
import Link from "next/link";
import BrandMark from "@/[locale]/components/BrandMark";

// Marco de las pantallas de acceso que no son el inicio de sesión (recuperar contraseña)
export default function AuthShell({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
    return (
        <main className="theme-field flex min-h-screen items-center justify-center bg-[#0f2733] px-4 py-10">
            <div className="w-full max-w-sm sm:max-w-md">
                <div className="mb-6 text-center sm:mb-8">
                    <Link href="/" className="inline-block text-2xl font-black text-white">
                        <BrandMark iconClassName="h-12 w-12 rounded-2xl bg-indigo-500/15 text-indigo-300" iconSize={22} />
                    </Link>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white sm:p-8">
                    <h1 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h1>
                    {text && <p className="mt-2 text-sm leading-relaxed text-gray-400">{text}</p>}
                    {children && <div className="mt-6">{children}</div>}
                </div>
            </div>
        </main>
    );
}

export const authPrimaryButton =
    "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const authSecondaryLink =
    "flex min-h-12 w-full items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-bold text-white transition-colors hover:border-white/40";
