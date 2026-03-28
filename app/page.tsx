import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-[#0a0a0f] min-h-screen">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d1a]/80 backdrop-blur-md border-b border-white/6">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">

          <span className="text-white font-black text-lg tracking-tight">
            BARBER<span className="text-indigo-400">SAAS</span>
          </span>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>

        </div>
      </nav>

      {/* Sections */}
      <HeroSection />
      <FeaturesSection />

      {/* Footer CTA */}
      <section className="bg-[#0a0a0f] py-24 px-6 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Ready to take control<br />of your schedule?
          </h2>
          <p className="text-gray-500 mb-10">
            Join barbers already managing their bookings with BarberSaaS.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Create your account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0f] border-t border-white/6 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-white font-black text-sm tracking-tight">
            BARBER<span className="text-indigo-400">SAAS</span>
          </span>
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} BarberSaaS. All rights reserved.
          </p>
        </div>
      </footer>

    </main>
  );
}