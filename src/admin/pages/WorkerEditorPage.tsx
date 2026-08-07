import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployee,
  useUpdateEmployee,
} from "@/shared/hooks/useHr";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/shared/components/ui/card";
import { LoadingState, Spinner } from "@/shared/components/StateViews";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  designation: z.string().min(2, "Designation is required"),
  salary: z.coerce.number().nonnegative("Salary can't be negative"),
  shift_hours: z.coerce
    .number()
    .positive("Shift must be more than 0")
    .max(24, "Shift can't exceed 24 hours"),
});
type FormValues = z.infer<typeof schema>;

/** Add (`/admin/hr/new`) or edit (`/admin/hr/:id`) a worker. */
export function WorkerEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useEmployee(id);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const removeEmployee = useDeleteEmployee();
  const backTo = isEdit ? `/admin/hr/${id}` : "/admin/hr";

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", designation: "", salary: 0, shift_hours: 12 },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        designation: existing.designation,
        salary: existing.salary,
        shift_hours: existing.shift_hours,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && id) {
        await updateEmployee.mutateAsync({ id, input: values });
        toast.success("Worker updated");
        navigate(`/admin/hr/${id}`);
      } else {
        const created = await createEmployee.mutateAsync(values);
        toast.success(`Worker added — ${created.employee_code}`);
        navigate(`/admin/hr/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="font-serif text-3xl font-bold text-primary">
        {isEdit ? "Edit Worker" : "Add Worker"}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>
            {isEdit
              ? existing?.employee_code
              : "Employee ID is generated automatically on save."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} placeholder="e.g. Ramesh Kumar" />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  {...register("designation")}
                  placeholder="e.g. Loom Operator"
                />
                {errors.designation && (
                  <p className="text-xs text-destructive">
                    {errors.designation.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Monthly salary (₹)</Label>
                <Input
                  id="salary"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("salary")}
                />
                {errors.salary && (
                  <p className="text-xs text-destructive">{errors.salary.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift_hours">Shift hours per day</Label>
                <Input
                  id="shift_hours"
                  type="number"
                  min={1}
                  max={24}
                  step="0.5"
                  {...register("shift_hours")}
                />
                {errors.shift_hours && (
                  <p className="text-xs text-destructive">
                    {errors.shift_hours.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="h-4 w-4" />}
                {isEdit ? "Save changes" : "Add worker"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={backTo}>Cancel</Link>
              </Button>
              {isEdit && id && (
                <Button
                  type="button"
                  variant="ghost"
                  className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={removeEmployee.isPending}
                  onClick={async () => {
                    if (
                      !confirm(
                        `Remove ${existing?.name}? Their attendance history will be deleted too.`,
                      )
                    )
                      return;
                    try {
                      await removeEmployee.mutateAsync(id);
                      toast.success("Worker removed");
                      navigate("/admin/hr");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Remove failed");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Remove worker
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
