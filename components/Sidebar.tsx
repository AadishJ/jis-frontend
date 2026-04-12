"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, logout } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const user = await getUser();

      if (!isMounted) {
        return;
      }

      setRole(user?.role ?? null);
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!role) {
      return;
    }

    const restrictedRoutes = [
      { prefix: "/cases/create", roles: ["REGISTRAR"] },
      { prefix: "/cases/pending", roles: ["REGISTRAR"] },
      { prefix: "/cases/hearings", roles: ["REGISTRAR"] },
      { prefix: "/cases/resolved", roles: ["REGISTRAR"] },
      { prefix: "/cases/closed", roles: ["JUDGE", "LAWYER"] },
    ];

    const blockedRoute = restrictedRoutes.find(
      (route) =>
        pathname.startsWith(route.prefix) && !route.roles.includes(role),
    );

    if (blockedRoute) {
      router.replace("/");
    }
  }, [pathname, role, router]);

  if (!role) return null;

  const nav = [
    { href: "/", label: "Dashboard", roles: ["REGISTRAR", "JUDGE", "LAWYER"] },

    { href: "/cases/pending", label: "Pending Cases", roles: ["REGISTRAR"] },

    { href: "/cases/create", label: "Create Case", roles: ["REGISTRAR"] },

    {
      href: "/cases/hearings",
      label: "Hearings By Date",
      roles: ["REGISTRAR"],
    },

    {
      href: "/cases/search",
      label: "Search By CIN",
      roles: ["REGISTRAR", "JUDGE", "LAWYER"],
    },

    {
      href: "/cases/resolved",
      label: "Resolved By Period",
      roles: ["REGISTRAR"],
    },

    {
      href: "/cases/closed",
      label: "Browse Closed",
      roles: ["JUDGE", "LAWYER"],
    },
  ];

  return (
    <aside className="h-screen w-64 bg-white border-r flex flex-col">
      <div className="p-5 border-b">
        <h1 className="font-bold text-lg">⚖️ JIS</h1>
        <p className="text-xs text-gray-500">{role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav
          .filter((item) => item.roles.includes(role))
          .map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  active ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={() => void logout()}
          className="w-full text-left text-red-600 px-3 py-2 hover:bg-red-50 rounded-lg"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
