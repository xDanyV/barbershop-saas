"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
    BookOpen,
    CalendarDays,
    Contact,
    LayoutDashboard,
    Users,
    ChevronDown,
    LogOut,
    Menu as MenuIcon,
    Scissors,
    ShieldCheck,
    Star,
    Store,
    UserRound,
    type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import BrandMark from "@/[locale]/components/BrandMark";
import BrandDialog from "@/[locale]/components/BrandDialog";
import LocaleSwitch from "@/[locale]/components/LocaleSwitch";
import NotificationBell from "@/[locale]/components/NotificationBell";

type NavItem = { label: string; path: string; icon: LucideIcon };

const BRAND_ICON = "h-9 w-9 bg-[#e4dccb] text-[#0f2733]";

export default function DashboardNavbar({ role }: { role: string }) {
    const t = useTranslations("DashboardNavbar");
    const locale = useLocale();
    const pathname = usePathname();
    const [moreOpen, setMoreOpen] = useState(false);

    const account: NavItem = { label: t("menu.account"), path: "/dashboard/account", icon: UserRound };
    const panel: NavItem = { label: t("menu.platform"), path: "/dashboard/admin", icon: ShieldCheck };
    const home: NavItem = { label: t("menu.home"), path: "/dashboard/admin", icon: LayoutDashboard };
    const team: NavItem = { label: t("menu.team"), path: "/dashboard/admin/team", icon: Users };
    const customers: NavItem = { label: t("menu.customers"), path: "/dashboard/admin/customers", icon: Contact };
    const business: NavItem = { label: t("menu.myBusiness"), path: "/dashboard/admin/my-business", icon: Store };
    const catalog: NavItem = { label: t("menu.catalog"), path: "/dashboard/barber/catalog", icon: Scissors };
    const agenda: NavItem = { label: t("menu.agenda"), path: "/dashboard/barber", icon: CalendarDays };
    // Las citas que esta persona reservó como cliente en otra barbería
    const bookings: NavItem = { label: t("menu.myBookings"), path: "/dashboard/customer/home", icon: BookOpen };

    // primary: barra principal en computadora. mobile: barra inferior (el resto va en "Más").
    let primary: NavItem[];
    let mobile: NavItem[];
    let menu: NavItem[];
    let homePath: string;

    if (role === "ADMIN") {
        primary = [panel];
        mobile = [panel];
        menu = [bookings, account];
        homePath = panel.path;
    } else if (role === "OWNER") {
        // Lo diario primero; en el teléfono lo menos frecuente pasa a "Más"
        primary = [home, agenda, catalog, team, customers, business];
        mobile = [home, agenda, team, business];
        menu = [bookings, account];
        homePath = home.path;
    } else if (role === "BARBER") {
        const reviews: NavItem = { label: t("menu.reviews"), path: "/dashboard/barber/reviews", icon: Star };

        primary = [agenda, catalog];
        mobile = [agenda, catalog];
        menu = [reviews, bookings, account];
        homePath = agenda.path;
    } else {
        const myAppointments: NavItem = { label: t("menu.myAppointments"), path: "/dashboard/customer/home", icon: CalendarDays };
        const book: NavItem = { label: t("menu.book"), path: "/dashboard/customer/barbers", icon: BookOpen };

        primary = [myAppointments, book];
        mobile = [myAppointments, book];
        menu = [{ label: t("menu.createBusiness"), path: "/dashboard/business/new", icon: Store }, account];
        homePath = myAppointments.path;
    }

    const href = (path: string) => `/${locale}${path}`;
    const isActive = (path: string) => pathname === href(path) || pathname === path;
    const moreItems = [...primary.filter((item) => !mobile.includes(item)), ...menu];
    const moreActive = moreItems.some((item) => isActive(item.path));

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" }).catch(() => null);
        window.location.assign(href("/login"));
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-[#0f2733] text-[#f1f3f2]">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-8 md:h-16">
                    <div className="flex min-w-0 items-center gap-8">
                        <Link href={href(homePath)} aria-label={t("home")} className="shrink-0">
                            <BrandMark iconClassName={BRAND_ICON} iconSize={18} />
                        </Link>

                        <nav aria-label={t("mainNav")} className="hidden items-center gap-1 md:flex">
                            {primary.map((item) => {
                                const active = isActive(item.path);

                                return (
                                    <Link
                                        key={item.path}
                                        href={href(item.path)}
                                        aria-current={active ? "page" : undefined}
                                        className={`relative flex h-16 items-center px-3 text-sm transition-colors ${active ? "font-semibold text-white" : "text-[#a9b7bc] hover:text-white"}`}
                                    >
                                        {item.label}
                                        {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5 bg-[#e8603a]" />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="ml-auto -mr-2 flex items-center md:mr-0">
                        <LocaleSwitch tone="dark" />
                        <NotificationBell />
                    </div>

                    <Menu as="div" className="relative hidden md:block">
                        <MenuButton className="flex min-h-11 items-center gap-2 px-3 text-sm text-[#a9b7bc] transition-colors hover:text-white data-[open]:text-white">
                            <UserRound size={18} aria-hidden="true" />
                            {t("accountMenu")}
                            <ChevronDown size={16} aria-hidden="true" />
                        </MenuButton>

                        <MenuItems
                            anchor="bottom end"
                            className="z-[60] mt-1 w-56 border border-[#dbe0de] bg-white py-1 text-sm text-[#0f2733] outline-none"
                        >
                            {menu.map((item) => (
                                <MenuItem key={item.path}>
                                    <Link href={href(item.path)} className="flex min-h-11 items-center gap-3 px-4 data-[focus]:bg-[#f1f3f2]">
                                        <item.icon size={18} aria-hidden="true" />
                                        {item.label}
                                    </Link>
                                </MenuItem>
                            ))}
                            <MenuItem>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex min-h-11 w-full items-center gap-3 border-t border-[#dbe0de] px-4 text-left data-[focus]:bg-[#f1f3f2]"
                                >
                                    <LogOut size={18} aria-hidden="true" />
                                    {t("logout")}
                                </button>
                            </MenuItem>
                        </MenuItems>
                    </Menu>
                </div>
            </header>

            <nav
                aria-label={t("mainNav")}
                className="fixed inset-x-0 bottom-0 z-50 bg-[#0f2733] pb-[env(safe-area-inset-bottom)] md:hidden"
            >
                <div className="flex items-stretch">
                    {mobile.map((item) => {
                        const active = isActive(item.path);

                        return (
                            <Link
                                key={item.path}
                                href={href(item.path)}
                                aria-current={active ? "page" : undefined}
                                className={`relative flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs ${active ? "font-semibold text-white" : "text-[#a9b7bc]"}`}
                            >
                                {active && <span aria-hidden="true" className="absolute inset-x-4 top-0 h-0.5 bg-[#e8603a]" />}
                                <item.icon size={22} aria-hidden="true" />
                                <span className="max-w-full truncate">{item.label}</span>
                            </Link>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setMoreOpen(true)}
                        aria-haspopup="dialog"
                        className={`relative flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs ${moreActive ? "font-semibold text-white" : "text-[#a9b7bc]"}`}
                    >
                        {moreActive && <span aria-hidden="true" className="absolute inset-x-4 top-0 h-0.5 bg-[#e8603a]" />}
                        <MenuIcon size={22} aria-hidden="true" />
                        {t("more")}
                    </button>
                </div>
            </nav>

            {moreOpen && (
                <BrandDialog title={t("more")} closeLabel={t("close")} onClose={() => setMoreOpen(false)}>
                    <ul className="divide-y divide-[var(--brand-surface)]">
                        {moreItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    href={href(item.path)}
                                    onClick={() => setMoreOpen(false)}
                                    className="flex min-h-14 items-center gap-3 font-semibold"
                                >
                                    <item.icon size={20} aria-hidden="true" />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <button type="button" onClick={handleLogout} className="flex min-h-14 w-full items-center gap-3 text-left font-semibold">
                                <LogOut size={20} aria-hidden="true" />
                                {t("logout")}
                            </button>
                        </li>
                    </ul>
                </BrandDialog>
            )}
        </>
    );
}
