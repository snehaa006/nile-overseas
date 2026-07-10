import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "@/shared/hooks/useSettings";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { LoadingState, Spinner } from "@/shared/components/StateViews";
import { BrandLogoManager } from "@/admin/components/BrandLogoManager";
import { SiteLogoManager } from "@/admin/components/SiteLogoManager";
import { HeroImageManager } from "@/admin/components/HeroImageManager";
import { TeamManager } from "@/admin/components/TeamManager";

const schema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  about_text: z.string().optional().nullable(),
  established_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("Invalid email").or(z.literal("")).optional().nullable(),
  address: z.string().optional().nullable(),
  map_link: z.string().url("Must be a URL").or(z.literal("")).optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

export function WebsiteSettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await update.mutateAsync(values);
      toast.success("Website content updated");
      reset(values);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Website Settings</h1>
        <p className="text-muted-foreground">
          These values render across the public website instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Company</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Company name" error={errors.company_name?.message}>
              <Input {...register("company_name")} />
            </Field>
            <Field label="Established year" error={errors.established_year?.message}>
              <Input type="number" className="max-w-32" {...register("established_year")} />
            </Field>
            <Field label="About section" error={errors.about_text?.message}>
              <Textarea rows={5} {...register("about_text")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone?.message}>
              <Input {...register("phone")} />
            </Field>
            <Field label="WhatsApp" error={errors.whatsapp?.message}>
              <Input {...register("whatsapp")} placeholder="+91…" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Google Maps link" error={errors.map_link?.message}>
              <Input {...register("map_link")} placeholder="https://maps.google.com/…" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address" error={errors.address?.message}>
                <Textarea rows={2} {...register("address")} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Spinner className="h-4 w-4" />} Save changes
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Home hero image</CardTitle>
          <p className="text-sm text-muted-foreground">
            The showcase photo shown in the homepage hero.
          </p>
        </CardHeader>
        <CardContent>
          <HeroImageManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Site logo</CardTitle>
          <p className="text-sm text-muted-foreground">
            The main Nile Overseas logo, shown site-wide.
          </p>
        </CardHeader>
        <CardContent>
          <SiteLogoManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand logos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload or replace the logo shown for each brand across the website.
          </p>
        </CardHeader>
        <CardContent>
          <BrandLogoManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Our Team</CardTitle>
          <p className="text-sm text-muted-foreground">
            The people shown in the “Our Team” section at the bottom of the Home
            page. Add a photo, name, role and short description for each person.
          </p>
        </CardHeader>
        <CardContent>
          <TeamManager />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
