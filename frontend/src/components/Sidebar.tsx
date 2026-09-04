import { NavLink } from "react-router-dom";
import { LogOut, ShieldCheck, GraduationCap } from "lucide-react";
import { BrandMark } from "@/components/Brand";
import { NAV_GROUPS } from "@/lib/nav";
import { useAuth } from "@/context/AuthContext";

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const RoleIcon = isAdmin ? ShieldCheck : GraduationCap;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink bg-rail transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-rail-line px-5 py-5">
        <BrandMark className="h-9 w-9" />
        <div className="min-w-0">
          <div className="text-[15px] leading-none font-extrabold tracking-tight text-white">
            CampusOS
          </div>
          <div className="eyebrow mt-1.5 text-rail-soft">AUST</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-6 last:mb-0">
            <div className="eyebrow px-2.5 pb-2.5 text-rail-soft/60">{group.label}</div>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === "/"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${
                        isActive
                          ? "bg-warn text-ink"
                          : "text-rail-soft hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-rail-line p-3">
        <div className="flex items-center gap-2.5 rounded-md bg-white/5 px-2.5 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-white/10 text-[13px] font-bold text-white">
            {user?.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-white">{user?.name}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-rail-soft">
              <RoleIcon className="h-3 w-3" />
              <span className="capitalize">{user?.role}</span>
              {user?.student_id && (
                <span className="truncate">
                  · {user.student_id}
                  {user.role === "student" && user.year ? ` (Y${user.year}S${user.semester})` : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-rail-soft transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
