import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth";
import { AppShell, RequireAdmin, SessionGate } from "./shell";
import { SCREEN001 } from "./pages/SCREEN001";
import { SCREEN002 } from "./pages/SCREEN002";
import { SCREEN003 } from "./pages/SCREEN003";
import { SCREEN004 } from "./pages/SCREEN004";
import { SCREEN005 } from "./pages/SCREEN005";
import { SCREEN006 } from "./pages/SCREEN006";
import { SCREEN007 } from "./pages/SCREEN007";
import { SCREEN008 } from "./pages/SCREEN008";
import { SCREEN009 } from "./pages/SCREEN009";
import { SCREEN010 } from "./pages/SCREEN010";
import { SCREEN011 } from "./pages/SCREEN011";
import { SCREEN012 } from "./pages/SCREEN012";
import { SCREEN403 } from "./pages/SCREEN403";
import { SCREEN404 } from "./pages/SCREEN404";
import { SCREENOFFLINE } from "./pages/SCREENOFFLINE";
import { SCREENCREATE } from "./pages/SCREENCREATE";

/** Routes generated from ui-spec. Shell owns nav, account name, and admin gating. */
export function App() {
  return (
    <SessionGate>
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<AppShell><SCREEN001 /></AppShell>} />
        <Route path="/products/:id" element={<AppShell><SCREEN002 /></AppShell>} />
        <Route path="/cart" element={<AppShell><SCREEN003 /></AppShell>} />
        <Route path="/checkout" element={<AppShell><SCREEN004 /></AppShell>} />
        <Route path="/orders/:id/confirmation" element={<RequireAuth><AppShell><SCREEN005 /></AppShell></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><AppShell><SCREEN006 /></AppShell></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><AppShell><SCREEN007 /></AppShell></RequireAuth>} />
        <Route path="/signin" element={<SCREEN008 />} />
        <Route path="/admin/products" element={<RequireAuth><RequireAdmin><AppShell><SCREEN009 /></AppShell></RequireAdmin></RequireAuth>} />
        <Route path="/admin/products/:id (and /admin/products/new)" element={<RequireAuth><RequireAdmin><AppShell><SCREEN010 /></AppShell></RequireAdmin></RequireAuth>} />
        <Route path="/admin/orders" element={<RequireAuth><RequireAdmin><AppShell><SCREEN011 /></AppShell></RequireAdmin></RequireAuth>} />
        <Route path="/admin/orders/:id" element={<RequireAuth><RequireAdmin><AppShell><SCREEN012 /></AppShell></RequireAdmin></RequireAuth>} />
        <Route path="/403" element={<AppShell><SCREEN403 /></AppShell>} />
        <Route path="/404" element={<AppShell><SCREEN404 /></AppShell>} />
        <Route path="/offline" element={<AppShell><SCREENOFFLINE /></AppShell>} />
        <Route path="/cart/new" element={<AppShell><SCREENCREATE /></AppShell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
    </SessionGate>
  );
}
