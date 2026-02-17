import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen bg-void bg-grid flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Background orbs */}
      <div
        className="orb w-[600px] h-[600px] -top-48 -left-48 opacity-20"
        style={{ background: "radial-gradient(circle, #6c63ff 0%, transparent 70%)" }}
      />
      <div
        className="orb w-[400px] h-[400px] -bottom-32 -right-32 opacity-15"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }}
      />
      <div
        className="orb w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10"
        style={{ background: "radial-gradient(circle, #6c63ff 0%, transparent 70%)" }}
      />

      {/* Hero content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Badge */}
        <div className="flex items-center justify-center mb-8">
          <span className="badge text-sm">
            <span className="realtime-dot" style={{ width: 6, height: 6 }} />
            Real-time sync across all tabs
          </span>
        </div>

        {/* Logo mark */}
        <div className="flex items-center justify-center mb-6">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl glow-accent"
            style={{
              background: "linear-gradient(135deg, #4a44cc 0%, #6c63ff 100%)",
            }}
          >
            🔖
          </div>
        </div>

        {/* Title */}
        <h1
          className="font-display font-bold text-6xl md:text-7xl mb-4 leading-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          <span className="text-snow">Smart</span>
          <br />
          <span className="gradient-text">Bookmark</span>
        </h1>

        {/* Description */}
        <p className="font-body text-ghost text-xl mb-12 max-w-md mx-auto leading-relaxed">
          Your bookmarks, always in sync. Private, fast, and beautiful — built
          for people who care about their workflow.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-lg mx-auto">
          {[
            { icon: "⚡", label: "Real-time sync" },
            { icon: "🔒", label: "Private by default" },
            { icon: "✨", label: "Instant access" },
          ].map((f) => (
            <div
              key={f.label}
              className="glass rounded-xl p-3 flex flex-col items-center gap-1.5"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-xs font-mono text-mist">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Login Button */}
        <LoginButton />

        <p className="mt-6 text-xs text-ghost font-mono">
          Sign in with Google — no email or password required
        </p>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, var(--void) 0%, transparent 100%)",
        }}
      />
    </main>
  );
}
