import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { speak } from "../lib/speech";

const NAV_ITEMS = [
  { to: "/", label: "首頁", icon: "🏠", end: true },
  { to: "/add", label: "新增", icon: "✏️", end: false },
  { to: "/sentences", label: "複習", icon: "🀄", end: false },
  { to: "/gacha", label: "轉蛋", icon: "🎁", end: false },
  { to: "/history", label: "紀錄", icon: "📅", end: false },
];

export function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  function handleClick(item: (typeof NAV_ITEMS)[number], e: React.MouseEvent) {
    speak(item.label);
    // "複習" has its own internal steps (mode-select → an active session →
    // a finished-round summary) that all live under the same "/sentences"
    // route. A plain <NavLink> click while already there is a no-op — the
    // pathname never changes — so tapping it after finishing a round just
    // left her stuck looking at the summary screen forever. Forcing a fresh
    // navigation with a bit of state that changes every time lets the page
    // notice the tap and jump back to its own mode-select home, matching
    // what tapping any other nav icon already feels like.
    if (item.to === "/sentences" && location.pathname.startsWith("/sentences")) {
      e.preventDefault();
      navigate("/sentences", { state: { resetToModeSelect: Date.now() } });
    }
  }

  return (
    <nav className="nav-bar">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          onClick={(e) => handleClick(item, e)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
