import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

const teamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100),
  owner_name: z.string().min(2, "Owner name must be at least 2 characters").max(100),
  owner_contact: z.string().min(10, "Contact must be at least 10 digits").max(15),
  owner_details: z.string().max(500).optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;
export type TeamFormResult = TeamFormData & { logo_file?: File | null; logo_preview?: string };

interface TeamFormProps {
  onSuccess: (team: TeamFormResult) => void;
}

const TeamForm = ({ onSuccess }: TeamFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      setLogoFileName(null);
      return;
    }

    const validFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      toast.error("Logo must be an image file (JPG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be less than 5MB");
      return;
    }

    setLogoFile(file);
    setLogoFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (formData: TeamFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Team captured (demo mode).");
      onSuccess({
        ...formData,
        logo_file: logoFile,
        logo_preview: logoPreview,
      });
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Team Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter team name"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_name">Owner Name *</Label>
        <Input
          id="owner_name"
          {...register("owner_name")}
          placeholder="Enter owner's full name"
        />
        {errors.owner_name && (
          <p className="text-sm text-destructive">{errors.owner_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_contact">Owner Contact *</Label>
        <Input
          id="owner_contact"
          {...register("owner_contact")}
          placeholder="Enter owner's phone number"
        />
        {errors.owner_contact && (
          <p className="text-sm text-destructive">{errors.owner_contact.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_details">Owner Details (Optional)</Label>
        <Textarea
          id="owner_details"
          {...register("owner_details")}
          placeholder="Additional information about the owner"
          rows={3}
        />
        {errors.owner_details && (
          <p className="text-sm text-destructive">{errors.owner_details.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo_file">Team Logo (Optional)</Label>
        <Input
          id="logo_file"
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
          onChange={handleLogoChange}
          className="flex-1"
        />
        <p className="text-xs text-muted-foreground">
          Accepted formats: JPG, PNG, GIF, WebP (max 5MB). Leave blank to use the default club logo.
        </p>
        {logoFileName && (
          <p className="text-xs text-muted-foreground">Uploaded: {logoFileName}</p>
        )}
        {logoPreview && (
          <div className="relative inline-block rounded-md border overflow-hidden mt-2">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-32 h-32 object-cover"
            />
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating Team..." : "Create Team"}
      </Button>
    </form>
  );
};

export default TeamForm;
