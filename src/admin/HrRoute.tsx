import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { canAccessHr } from "@/shared/lib/access";

/** Keeps non-owner accounts out of `/admin/hr/*`, menu hidden or not. */
export function HrRoute({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  if (!canAccessHr(session?.user.email)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
