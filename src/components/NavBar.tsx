import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "首頁", icon: "🏠", end: true },
  { to: "/add", label: "新增", icon: "✏️", end: false },
  { to: "/review", label: "複習", icon: "🀄", end: false },
  { to: "/sentences", label: "造句", icon: "📝", end: false },
  { to: "/history", label: "紀錄", icon: "📅", end: false },
];

export function NavBar() {
  return (
    <nav className="nav-bar">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
