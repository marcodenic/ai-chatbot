// app/(auth)/layout.tsx
/**
 * Forces Node runtime for everything under /app/(auth).
 * This ensures DB or Supabase code can use fs, net, etc.
 */
export const runtime = "nodejs";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a server component by default (no "use client").
  return <>{children}</>;
}
