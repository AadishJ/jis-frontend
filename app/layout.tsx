"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getUser } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [verifiedPath, setVerifiedPath] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      if (pathname === "/login") {
        return;
      }

      const user = await getUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      setVerifiedPath(pathname);
    };

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const isLoginPage = pathname === "/login";
  const checkingAuth = !isLoginPage && verifiedPath !== pathname;

  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-gray-50">
        {checkingAuth && !isLoginPage ? (
          <div className="flex h-screen items-center justify-center">
            <p className="text-gray-500">Checking session...</p>
          </div>
        ) : isLoginPage ? (
          <main>{children}</main>
        ) : (
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
