import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useBlankets, useToggleBlanketActive } from "@/shared/hooks/useBlankets";
import { useBrands } from "@/shared/hooks/useCatalogue";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/shared/components/StateViews";
import { formatCurrency, formatWeight } from "@/shared/utils/format";

export function ProductsAdminPage() {
  const [brandId, setBrandId] = useState<string | undefined>();
  const { data: brands } = useBrands();
  const { data: blankets, isLoading, isError, error, refetch } = useBlankets(brandId);
  const toggle = useToggleBlanketActive();

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggle.mutateAsync({ id, isActive: !isActive });
      toast.success(isActive ? "Blanket deactivated" : "Blanket activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Products</h1>
          <p className="text-muted-foreground">Manage blankets, prices and images.</p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new"><Plus className="h-4 w-4" /> Add Blanket</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!brandId} onClick={() => setBrandId(undefined)}>All</FilterChip>
        {brands?.map((b) => (
          <FilterChip key={b.id} active={brandId === b.id} onClick={() => setBrandId(b.id)}>
            {b.name}
          </FilterChip>
        ))}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : blankets && blankets.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blankets.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.sku}</TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{formatWeight(b.weight_kg)}</TableCell>
                  <TableCell>{formatCurrency(b.rate)}</TableCell>
                  <TableCell>
                    {b.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="muted">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/admin/products/${b.id}`}>
                          <Pencil className="h-3 w-3" /> Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant={b.is_active ? "ghost" : "secondary"}
                        onClick={() => handleToggle(b.id, b.is_active)}
                      >
                        {b.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No blankets yet"
          description="Add your first blanket to get started."
          action={
            <Button asChild>
              <Link to="/admin/products/new"><Plus className="h-4 w-4" /> Add Blanket</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

function FilterChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-4 py-1.5 text-sm font-medium transition " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted")
      }
    >
      {children}
    </button>
  );
}
