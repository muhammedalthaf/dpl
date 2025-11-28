import { useState, useEffect } from "react";
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
import { ArrowLeft, Copy, Download, XCircle } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";
import { paymentConfig } from "@/config/payment";
import { panchayats } from "@/config/panchayats";
import { registrationAPI, settingsAPI } from "@/lib/api";

const playerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  role: z.enum(["bat", "ball", "wk", "all-rounder"]),
  place: z.string().min(2, "Place must be at least 2 characters").max(100),
  panchayat: z.string().min(1, "Please select your Panchayat"),
  id_proof_type: z.enum(["aadhar", "driving_license", "voter_id", "passport"]).optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

const RegisterPlayer = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerImageFile, setPlayerImageFile] = useState<File | null>(null);
  const [playerImageFileName, setPlayerImageFileName] = useState<string | null>(null);
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentFileName, setPaymentFileName] = useState<string | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofFileName, setIdProofFileName] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
  });

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      const settings = await settingsAPI.getSettings();
      setRegistrationOpen(settings.registration_open);
    } catch (error) {
      console.error("Failed to check registration status:", error);
      setRegistrationOpen(true); // Default to open if can't fetch
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const roleValue = watch("role");
  const panchayatValue = watch("panchayat");
  const idProofTypeValue = watch("id_proof_type");

  const handleCopy = async (value: string, label: string) => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch (error) {
      console.error("Copy failed", error);
      toast.error("Unable to copy. Please copy manually.");
    }
  };

  const handlePlayerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPlayerImageFile(null);
      setPlayerImageFileName(null);
      return;
    }

    const validFormats = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validFormats.includes(file.type)) {
      toast.error("Player photo must be an image (JPG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Player photo must be less than 5MB");
      return;
    }

    setPlayerImageFile(file);
    setPlayerImageFileName(file.name);
  };

  const handlePaymentScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPaymentScreenshotFile(null);
      setPaymentFileName(null);
      return;
    }

    const validFormats = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validFormats.includes(file.type)) {
      toast.error("Payment screenshot must be an image (JPG, PNG) or PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Payment screenshot must be less than 10MB");
      return;
    }

    setPaymentScreenshotFile(file);
    setPaymentFileName(file.name);
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setIdProofFile(null);
      setIdProofFileName(null);
      return;
    }

    const validFormats = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validFormats.includes(file.type)) {
      toast.error("ID proof must be a PDF or image file (JPG, PNG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("ID proof must be less than 10MB");
      return;
    }

    setIdProofFile(file);
    setIdProofFileName(file.name);
  };

  const onSubmit = async (data: PlayerFormData) => {
    setIsSubmitting(true);

    if (!playerImageFile) {
      toast.error("Please upload your photo before submitting.");
      setIsSubmitting(false);
      return;
    }

    if (!paymentScreenshotFile) {
      toast.error("Please upload the payment screenshot before submitting.");
      setIsSubmitting(false);
      return;
    }

    if (data.id_proof_type && !idProofFile) {
      toast.error("Please upload your ID proof document.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("player_name", data.name);
      if (data.email) formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("role", data.role);
      formData.append("place", data.place);
      formData.append("panchayat", data.panchayat);
      formData.append("player_image", playerImageFile);
      formData.append("payment_screenshot", paymentScreenshotFile);

      if (data.id_proof_type && idProofFile) {
        formData.append("id_proof_type", data.id_proof_type);
        formData.append("id_proof_file", idProofFile);
      }

      await registrationAPI.createRegistrationWithFile(formData);
      toast.success("Registration submitted successfully! Please wait for approval.");

      // Store locally as well for reference
      localStorage.setItem("cvcl-latest-registration", JSON.stringify({
        player_name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        place: data.place,
        panchayat: data.panchayat,
        id_proof_type: data.id_proof_type,
      }));

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking registration status
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gradient-primary py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-primary-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show registration closed message
  if (registrationOpen === false) {
    return (
      <div className="min-h-screen bg-gradient-primary py-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <Link to="/" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <img src={clubLogo} alt="Club Logo" className="mx-auto mb-4" style={{height:"20vh", objectFit: "cover"}}/>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-card-foreground mb-2">Registration Closed</h2>
                <p className="text-muted-foreground mb-6">
                  Player registration is currently closed. Please check back later or contact the organizers for more information.
                </p>
                <Link to="/">
                  <Button size="lg">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <img src={clubLogo} alt="Club Logo" className="mx-auto mb-4 "  style={{height:"20vh", objectFit: "cover"}}/>
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">Player Registration</h1>
          <p className="text-primary-foreground/80">Register for the DPL Season 1</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Registration Form</CardTitle>
            <CardDescription>Fill in your details to register for the league</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4 rounded-lg border p-4 bg-card/40">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold">Payment Instructions</p>
                    <p className="text-xs text-muted-foreground">{paymentConfig.note}</p>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={paymentConfig.qrCodeImage} download="cvcl-payment-qr.png">
                      <Download className="h-4 w-4 mr-2" />
                      Save QR
                    </a>
                  </Button>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <div className="rounded-md bg-background/70 border p-3 flex items-center justify-center">
                    <img
                      src={paymentConfig.qrCodeImage}
                      alt="League Payment QR"
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">UPI ID</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="rounded bg-background px-2 py-1 text-sm">{paymentConfig.upiId}</code>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(paymentConfig.upiId, "UPI ID")}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">GPay Number</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="rounded bg-background px-2 py-1 text-sm">{paymentConfig.gpayNumber}</code>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(paymentConfig.gpayNumber, "GPay number")}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                <Select value={roleValue} onValueChange={(value) => setValue("role", value as any)}>
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
                <Label htmlFor="panchayat">Panchayat *</Label>
                <Select
                  value={panchayatValue}
                  onValueChange={(value) => setValue("panchayat", value as any, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your Panchayat" />
                  </SelectTrigger>
                  <SelectContent>
                    {panchayats.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.panchayat && (
                  <p className="text-sm text-destructive">{errors.panchayat.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="playerImage">Your Photo *</Label>
                <Input
                  id="playerImage"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handlePlayerImageChange}
                  className="flex-1"
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: JPG, PNG (max 5MB). Please upload a clear photo of yourself.
                </p>
                {playerImageFileName && (
                  <p className="text-xs text-muted-foreground">Uploaded: {playerImageFileName}</p>
                )}
                {playerImageFile && (
                  <div className="relative inline-block rounded-md border overflow-hidden mt-2">
                    <img
                      src={URL.createObjectURL(playerImageFile)}
                      alt="Player photo preview"
                      className="w-32 h-32 object-cover bg-background"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_proof_type">ID Proof Type (Optional)</Label>
                <Select
                  value={idProofTypeValue}
                  onValueChange={(value) => setValue("id_proof_type", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID proof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aadhar">Aadhar Card</SelectItem>
                    <SelectItem value="driving_license">Driving License</SelectItem>
                    <SelectItem value="voter_id">Voter ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                  </SelectContent>
                </Select>
                {errors.id_proof_type && (
                  <p className="text-sm text-destructive">{errors.id_proof_type.message}</p>
                )}
              </div>

              {idProofTypeValue && (
                <div className="space-y-2">
                  <Label htmlFor="idProof">Upload ID Proof ({idProofTypeValue.replace('_', ' ').toUpperCase()}) *</Label>
                  <Input
                    id="idProof"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleIdProofChange}
                    className="flex-1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: PDF, JPG, PNG (max 10MB)
                  </p>
                  {idProofFileName && (
                    <p className="text-xs text-muted-foreground">Uploaded: {idProofFileName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentProof">Payment Screenshot *</Label>
                <Input
                  id="paymentProof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handlePaymentScreenshotChange}
                  className="flex-1"
                />
                {paymentFileName && (
                  <p className="text-xs text-muted-foreground">Uploaded: {paymentFileName}</p>
                )}
                {paymentScreenshotFile && paymentScreenshotFile.type.startsWith('image/') && (
                  <div className="relative inline-block rounded-md border overflow-hidden mt-2">
                    <img
                      src={URL.createObjectURL(paymentScreenshotFile)}
                      alt="Payment screenshot preview"
                      className="w-48 h-48 object-contain bg-background"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register Player"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Note: Registration fee is non-refundable.
              </p>

              {/* WhatsApp Support Button */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center mb-2">Need help with registration?</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  onClick={() => {
                    const supportNumber = `91${paymentConfig.gpayNumber}`;
                    const message = "Hi, I need help with DPL player registration.";
                    window.open(`https://wa.me/${supportNumber}?text=${encodeURIComponent(message)}`, "_blank");
                  }}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Contact Support on WhatsApp
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPlayer;
