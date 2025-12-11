import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Eye, Check, X, Loader, Image, FileText, RefreshCw, Download, MessageCircle } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";
import { registrationAPI } from "@/lib/api";

// Backend server URL for resolving uploaded file paths
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

interface Registration {
  _id: string;
  player_name: string;
  email?: string;
  phone: string;
  role: string;
  place: string;
  panchayat?: string;
  player_image_url?: string;
  payment_screenshot_url?: string;
  id_proof_type?: string;
  id_proof_url?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  created_at: string;
}

const Registrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [imageTitle, setImageTitle] = useState<string>("");

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const status = statusFilter === "all" ? undefined : statusFilter;
      const data = await registrationAPI.getAllRegistrations(0, 100, status);
      setRegistrations(data.registrations || []);
    } catch (error: any) {
      toast.error("Failed to load registrations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  const openApproveDialog = (registration: Registration) => {
    setSelectedRegistration(registration);
    setPaymentReference("");
    setApproveDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;

    if (!paymentReference.trim()) {
      toast.error("Please enter payment reference number");
      return;
    }

    try {
      setActionLoading(true);
      await registrationAPI.approveRegistration(selectedRegistration._id, paymentReference.trim());
      toast.success(`${selectedRegistration.player_name} approved and added to players!`);
      fetchRegistrations();
      setApproveDialogOpen(false);
      setViewDialogOpen(false);
      setPaymentReference("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve registration");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      setActionLoading(true);
      await registrationAPI.rejectRegistration(selectedRegistration._id, rejectionReason);
      toast.success(`${selectedRegistration.player_name} registration rejected`);
      fetchRegistrations();
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectionReason("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to reject registration");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (registration: Registration) => {
    setSelectedRegistration(registration);
    setRejectDialogOpen(true);
  };

  const openWhatsApp = (phone: string, playerName: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCode = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const message = `Hi ${playerName}, regarding your DPL registration...`;
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Resolve file URL - handles both base64 data URLs and server-relative paths
  const resolveFileUrl = (url: string): string => {
    if (!url) return "";
    // If it's already a data URL (base64) or absolute URL, return as-is
    if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // If it's a relative path (e.g., /uploads/...), prepend the backend URL
    return `${BACKEND_URL}${url}`;
  };

  // Check if a URL points to an image file
  const isImageFile = (url: string): boolean => {
    if (!url) return false;
    // Check for base64 image data URLs
    if (url.startsWith("data:image/")) return true;
    // Check file extension for common image types
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.endsWith(ext));
  };

  const viewImage = (imageUrl: string, title: string) => {
    setCurrentImage(resolveFileUrl(imageUrl));
    setImageTitle(title);
    setImageDialogOpen(true);
  };

  const downloadFile = (url: string, filename: string) => {
    const resolvedUrl = resolveFileUrl(url);
    const link = document.createElement("a");
    link.href = resolvedUrl;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500">Pending</Badge>;
      case "approved": return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-500">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      bat: "bg-blue-500", ball: "bg-green-500", wk: "bg-purple-500", "all-rounder": "bg-orange-500"
    };
    return <Badge className={colors[role] || "bg-gray-500"}>{role}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="page-container bg-gradient-primary">
      <div className="content-container">
        <Link to="/admin" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-4 sm:mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={clubLogo} alt="Club Logo" className="h-12 sm:h-16 object-contain" />
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-primary-foreground">Player Registrations</h1>
              <p className="text-primary-foreground/80 text-sm sm:text-base">{registrations.length} registrations found</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 sm:flex-none sm:w-36 bg-white">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchRegistrations} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="h-8 w-8 text-primary-foreground animate-spin" />
          </div>
        ) : registrations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No registrations found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg._id}>
                      <TableCell>
                        {reg.player_image_url ? (
                          <img
                            src={resolveFileUrl(reg.player_image_url)}
                            alt={reg.player_name}
                            className="w-10 h-10 rounded-full object-cover cursor-pointer border"
                            onClick={() => viewImage(reg.player_image_url!, `${reg.player_name}'s Photo`)}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                            {reg.player_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{reg.player_name}</TableCell>
                      <TableCell>{reg.phone}</TableCell>
                      <TableCell>{getRoleBadge(reg.role)}</TableCell>
                      <TableCell>{reg.place}</TableCell>
                      <TableCell>{getStatusBadge(reg.status)}</TableCell>
                      <TableCell>{formatDate(reg.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedRegistration(reg); setViewDialogOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {reg.status === "pending" && (
                            <>
                              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => openApproveDialog(reg)} disabled={actionLoading}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => openRejectDialog(reg)} disabled={actionLoading}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* View Registration Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registration Details</DialogTitle>
            </DialogHeader>
            {selectedRegistration && (
              <div className="space-y-4">
                {/* Player Image and Basic Info */}
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  {selectedRegistration.player_image_url ? (
                    <img
                      src={resolveFileUrl(selectedRegistration.player_image_url)}
                      alt={selectedRegistration.player_name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover cursor-pointer border shadow-sm flex-shrink-0"
                      onClick={() => viewImage(selectedRegistration.player_image_url!, `${selectedRegistration.player_name}'s Photo`)}
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-2xl font-bold flex-shrink-0">
                      {selectedRegistration.player_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-semibold">{selectedRegistration.player_name}</h3>
                    <p className="text-muted-foreground">{selectedRegistration.phone}</p>
                    <div className="flex gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                      {getRoleBadge(selectedRegistration.role)}
                      {getStatusBadge(selectedRegistration.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground">Email</Label><p className="font-medium break-all">{selectedRegistration.email || "N/A"}</p></div>
                  <div><Label className="text-muted-foreground">Place</Label><p className="font-medium">{selectedRegistration.place}</p></div>
                  <div><Label className="text-muted-foreground">Panchayat</Label><p className="font-medium">{selectedRegistration.panchayat || "N/A"}</p></div>
                  <div><Label className="text-muted-foreground">Registered On</Label><p className="font-medium">{formatDate(selectedRegistration.created_at)}</p></div>
                </div>
                {selectedRegistration.rejection_reason && (
                  <div className="bg-red-50 p-3 rounded-md">
                    <Label className="text-red-600">Rejection Reason</Label>
                    <p className="text-red-700">{selectedRegistration.rejection_reason}</p>
                  </div>
                )}
                <div className="flex gap-2 sm:gap-4 flex-wrap">
                  {selectedRegistration.player_image_url && (
                    <Button variant="outline" size="sm" onClick={() => viewImage(selectedRegistration.player_image_url!, `${selectedRegistration.player_name}'s Photo`)}>
                      <Image className="h-4 w-4 mr-2" /> View Photo
                    </Button>
                  )}
                  {selectedRegistration.payment_screenshot_url && (
                    <Button variant="outline" size="sm" onClick={() => viewImage(selectedRegistration.payment_screenshot_url!, "Payment Screenshot")}>
                      <Image className="h-4 w-4 mr-2" /> View Payment
                    </Button>
                  )}
                  {selectedRegistration.id_proof_url && (
                    isImageFile(selectedRegistration.id_proof_url) ? (
                      <Button variant="outline" size="sm" onClick={() => viewImage(selectedRegistration.id_proof_url!, `ID Proof (${selectedRegistration.id_proof_type || "Document"})`)}>
                        <FileText className="h-4 w-4 mr-2" /> View ID Proof
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => downloadFile(selectedRegistration.id_proof_url!, `id_proof_${selectedRegistration.player_name.replace(/\s+/g, "_")}`)}>
                        <Download className="h-4 w-4 mr-2" /> Download ID Proof
                      </Button>
                    )
                  )}
                  {selectedRegistration.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => openWhatsApp(selectedRegistration.phone, selectedRegistration.player_name)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                  )}
                </div>
                {selectedRegistration.status === "pending" && (
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" onClick={() => openApproveDialog(selectedRegistration)} disabled={actionLoading}>
                      <Check className="h-4 w-4 mr-2" />
                      Approve & Create Player
                    </Button>
                    <Button variant="destructive" className="w-full sm:w-auto" onClick={() => openRejectDialog(selectedRegistration)} disabled={actionLoading}>
                      <X className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Registration</DialogTitle>
              <DialogDescription>Please provide a reason for rejecting {selectedRegistration?.player_name}'s registration.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Input id="rejection-reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter reason for rejection" className="mt-2" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}>
                {actionLoading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}Confirm Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Registration</DialogTitle>
              <DialogDescription>Enter the payment reference number for {selectedRegistration?.player_name}'s registration.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="payment-reference">Payment Reference Number *</Label>
                <Input
                  id="payment-reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter payment reference / UTR number"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">This helps prevent duplicate payments from being processed.</p>
              </div>
              {selectedRegistration?.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  onClick={() => openWhatsApp(selectedRegistration.phone, selectedRegistration.player_name)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact {selectedRegistration.player_name} on WhatsApp
                </Button>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={actionLoading || !paymentReference.trim()}>
                {actionLoading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image View Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{imageTitle}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img src={currentImage} alt={imageTitle} className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Registrations;
