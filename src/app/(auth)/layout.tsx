// layout.tsx — src/app/(auth)/layout.tsx — 2026-05-19
// Layout para páginas de autenticación (sin sidebar)

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sas-navy flex items-center justify-center p-4">
      {children}
    </div>
  );
}
