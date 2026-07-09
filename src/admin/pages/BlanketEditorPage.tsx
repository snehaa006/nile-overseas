import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useBrands } from "@/shared/hooks/useCatalogue";
import {
  useBlanket,
  useCreateBlanket,
  useUpdateBlanket,
} from "@/shared/hooks/useBlankets";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/shared/components/ui/card";
import { Spinner, LoadingState } from "@/shared/components/StateViews";
import { ImageManager } from "../components/ImageManager";

const schema = z.object({
  product_id: z.string().uuid("Select a brand"),
  name: z.string().min(2, "Name is required"),
  weight_kg: z.coerce.number().positive("Weight must be greater than 0"),
  rate: z.coerce.number().nonnegative("Rate can't be negative"),
  display_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function BlanketEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: brands } = useBrands();
  const { data: existing, isLoading } = useBlanket(id);
  const createBlanket = useCreateBlanket();
  const updateBlanket = useUpdateBlanket();

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { display_order: 0, is_active: true },
  });

  useEffect(() => {
    if (existing) {
      reset({
        product_id: existing.product_id,
        name: existing.name,
        weight_kg: existing.weight_kg,
        rate: existing.rate,
        display_order: existing.display_order,
        is_active: existing.is_active,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && id) {
        await updateBlanket.mutateAsync({ id, input: values });
        toast.success("Blanket updated");
      } else {
        const created = await createBlanket.mutateAsync(values);
        toast.success(`Blanket created — SKU ${created.sku}`);
        navigate(`/admin/products/${created.id}`, { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <h1 className="font-serif text-3xl font-bold text-primary">
        {isEdit ? "Edit Blanket" : "Add Blanket"}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>
            {isEdit ? `SKU ${existing?.sku ?? ""}` : "SKU is generated automatically on save."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} placeholder="e.g. Premium Mink" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_id">Brand</Label>
                <select
                  id="product_id"
                  {...register("product_id")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a brand…</option>
                  {brands?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.product_id && <p className="text-xs text-destructive">{errors.product_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display order</Label>
                <Input id="display_order" type="number" {...register("display_order")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input id="weight_kg" type="number" step="0.01" {...register("weight_kg")} />
                {errors.weight_kg && <p className="text-xs text-destructive">{errors.weight_kg.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Rate (₹)</Label>
                <Input id="rate" type="number" step="0.01" {...register("rate")} />
                {errors.rate && <p className="text-xs text-destructive">{errors.rate.message}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded border-input" />
              Active (visible on the public website)
            </label>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="h-4 w-4" />}
                {isEdit ? "Save changes" : "Create blanket"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/admin/products">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isEdit && id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
            <CardDescription>
              Upload multiple images. The first upload becomes the primary image.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageManager blanketId={id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
