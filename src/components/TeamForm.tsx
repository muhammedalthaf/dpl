import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

const teamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100),
  owner_name: z.string().min(2, "Owner name must be at least 2 characters").max(100),
  owner_contact: z.string().min(10, "Contact must be at least 10 digits").max(15),
  owner_details: z.string().max(500).optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormProps {
  onSuccess: () => void;
}

const TeamForm = ({ onSuccess }: TeamFormProps) => {
  const [teamIcon, setTeamIcon] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
  });

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setTeamIcon(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('player-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('player-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSubmit = async (data: TeamFormData) => {
    setIsSubmitting(true);

    try {
      let iconUrl = null;

      if (teamIcon) {
        iconUrl = await uploadFile(teamIcon);
        if (!iconUrl) {
          toast.error("Failed to upload team icon");
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from('teams')
        .insert([
          {
            name: data.name,
            owner_name: data.owner_name,
            owner_contact: data.owner_contact,
            owner_details: data.owner_details || null,
            icon_url: iconUrl,
          },
        ]);

      if (error) throw error;

      toast.success("Team created successfully!");
      onSuccess();
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error("Failed to create team. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
        <Label htmlFor="teamIcon">Team Icon</Label>
        <div className="flex items-center gap-2">
          <Input
            id="teamIcon"
            type="file"
            accept="image/*"
            onChange={handleIconChange}
            className="flex-1"
          />
          {teamIcon && <Upload className="h-5 w-5 text-primary" />}
        </div>
        <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
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
