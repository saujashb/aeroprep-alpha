import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Radar,
  Route,
  FlaskConical,
  UserCircle,
  Plane,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/radar", label: "Knowledge Radar", icon: Radar },
  { to: "/learn", label: "Learning Path", icon: Route },
  { to: "/lab", label: "Simulator Lab", icon: FlaskConical },
  { to: "/profile", label: "Progress Profile", icon: UserCircle },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-panel-border bg-panel">
      <div className="flex items-center gap-2 border-b border-panel-border px-4 py-4">
        <Plane className="h-5 w-5 text-hud" />
        <div>
          <p className="text-sm font-semibold text-ink">AeroPrep Alpha</p>
          <p className="text-[10px] tracking-widest text-ink-muted uppercase">Pre-PPL Ground School</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-300 ${
                isActive
                  ? "bg-hud/15 text-hud"
                  : "text-ink-muted hover:bg-panel-raised hover:text-ink"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-panel-border p-3 text-[10px] text-ink-muted">
        Local-first · Progress saved in browser
      </div>
    </aside>
  );
}
