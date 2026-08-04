import { Link } from "react-router-dom";
import { Package, Boxes, Factory, TrendingUp, Layers, Tag } from "lucide-react";
import { useDashboard } from "@/shared/hooks/useDashboard";
import { useBlankets } from "@/shared/hooks/useBlankets";
import { StatCard } from "../components/StatCard";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatNumber } from "@/shared/utils/format";

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboard();
  const { data: blankets } = useBlankets();

  const recent = (blankets ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Dashboard</h1>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">Add Blanket</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Brands" value={formatNumber(stats?.totalBrands)} icon={Tag} loading={isLoading} />
        <StatCard label="Total Blankets" value={formatNumber(stats?.totalBlankets)} icon={Package} loading={isLoading} />
        <StatCard label="Active Blankets" value={formatNumber(stats?.activeBlankets)} icon={Layers} loading={isLoading} />
        <StatCard label="Monthly Production" value={formatNumber(stats?.monthlyProduction)} icon={Factory} loading={isLoading} />
        <StatCard label="Monthly Sales" value={formatNumber(stats?.monthlySales)} icon={TrendingUp} loading={isLoading} />
        <StatCard label="Current Stock" value={formatNumber(stats?.currentStock)} icon={Boxes} loading={isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recently added blankets</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blankets yet.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link to={`/admin/products/${b.id}`} className="font-medium hover:text-accent">
                      {b.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{b.sku}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
