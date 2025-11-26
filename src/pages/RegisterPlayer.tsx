import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";

const playerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  role: z.enum(["bat", "ball", "wk", "all-rounder"]),
  place: z.string().min(2, "Place must be at least 2 characters").max(100),
});

type PlayerFormData = z.infer<typeof playerSchema>;

const RegisterPlayer = () => {
  const navigate = useNavigate();
  const [playerImage, setPlayerImage] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'player' | 'id') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (type === 'player') {
        setPlayerImage(file);
      } else {
        setIdProof(file);
      }
    }
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSubmit = async (data: PlayerFormData) => {
    setIsSubmitting(true);

    try {
      let imageUrl = null;
      let idProofUrl = null;

      if (playerImage) {
        imageUrl = await uploadFile(playerImage, 'player-images');
        if (!imageUrl) {
          toast.error("Failed to upload player image");
          setIsSubmitting(false);
          return;
        }
      }

      if (idProof) {
        idProofUrl = await uploadFile(idProof, 'id-proofs');
        if (!idProofUrl) {
          toast.error("Failed to upload ID proof");
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from('players')
        .insert([
          {
            name: data.name,
            email: data.email || null,
            phone: data.phone,
            role: data.role,
            place: data.place,
            image_url: imageUrl,
            id_proof_url: idProofUrl,
          },
        ]);

      if (error) throw error;

      toast.success("Player registered successfully!");
      navigate("/players");
    } catch (error) {
      console.error('Error registering player:', error);
      toast.error("Failed to register player. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <img src={clubLogo} alt="Club Logo" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">Player Registration</h1>
          <p className="text-primary-foreground/80">Register for the Calicut Village Cricket League</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Registration Form</CardTitle>
            <CardDescription>Fill in your details to register for the league</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Player Role *</Label>
                <Select onValueChange={(value) => setValue("role", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bat">Batsman</SelectItem>
                    <SelectItem value="ball">Bowler</SelectItem>
                    <SelectItem value="wk">Wicket Keeper</SelectItem>
                    <SelectItem value="all-rounder">All-Rounder</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="place">Place *</Label>
                <Input
                  id="place"
                  {...register("place")}
                  placeholder="Your village/area name"
                />
                {errors.place && (
                  <p className="text-sm text-destructive">{errors.place.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="playerImage">Player Photo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="playerImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'player')}
                    className="flex-1"
                  />
                  {playerImage && <Upload className="h-5 w-5 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idProof">ID Proof (Aadhar/Voter ID/Driving License/Passport)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="idProof"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleImageChange(e, 'id')}
                    className="flex-1"
                  />
                  {idProof && <Upload className="h-5 w-5 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register Player"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPlayer;
