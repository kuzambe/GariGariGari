import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useVehicle } from "@/hooks/useVehicle";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  FileText,
  ClipboardList,
  BadgeCheck,
  CreditCard,
  BookOpen,
  Lock,
  Plus,
  ArrowLeft,
  Loader2,
  Eye,
  X,
} from "lucide-react";

const CATEGORIES = [
  { key: "insurance", label: "Insurance", icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "ownership", label: "Ownership", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
  { key: "registration", label: "Registration", icon: ClipboardList, color: "text-green-500", bg: "bg-green-500/10" },
  { key: "tint_exemption", label: "Tint Exemption", icon: BadgeCheck, color: "text-orange-500", bg: "bg-orange-500/10" },
  { key: "drivers_license", label: "Driver's License", icon: CreditCard, color: "text-rose-500", bg: "bg-rose-500/10" },
  { key: "vehicle_handbook", label: "Vehicle Handbook", icon: BookOpen, color: "text-teal-500", bg: "bg-teal-500/10" },
] as const;

interface Doc {
  id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const { data: vehicle } = useVehicle();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Doc | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const { data: docs = [] } = useQuery<Doc[]>({
    queryKey: ["documents", user?.id, vehicle?.id],
    enabled: !!user && !!vehicle,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user!.id)
        .eq("vehicle_id", vehicle!.id);
      if (error) return [];
      return data ?? [];
    },
  });

  function docForCategory(key: string) {
    return docs.find((d) => d.document_type === key) ?? null;
  }

  function handleCategoryClick(key: string) {
    const existing = docForCategory(key);
    if (existing) {
      openDoc(existing);
    } else {
      setUploadingCategory(key);
      fileRef.current?.click();
    }
  }

  async function openDoc(doc: Doc) {
    setViewingDoc(doc);
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_url, 60);
    setViewUrl(data?.signedUrl ?? null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadingCategory || !user || !vehicle) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${vehicle.id}/${uploadingCategory}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploadingCategory(null);
      return;
    }

    const { error: dbError } = await supabase.from("documents").upsert({
      user_id: user.id,
      vehicle_id: vehicle.id,
      document_type: uploadingCategory,
      file_url: path,
      file_name: file.name,
      uploaded_at: new Date().toISOString(),
    }, { onConflict: "user_id,vehicle_id,document_type" });

    if (dbError) {
      toast({ title: "Could not save document record", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "Document saved" });
      qc.invalidateQueries({ queryKey: ["documents"] });
    }

    setUploadingCategory(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-30">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <span className="text-sm font-bold tracking-tight">Gari</span>
        </div>
        <span className="text-sm font-semibold">Documents</span>
        <div className="w-16" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Privacy notice */}
        <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
          <Lock size={13} className="text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">Your documents are encrypted and only accessible by you.</p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(({ key, label, icon: Icon, color, bg }) => {
            const doc = docForCategory(key);
            const isUploading = uploadingCategory === key;
            return (
              <button
                key={key}
                onClick={() => handleCategoryClick(key)}
                disabled={isUploading}
                className="relative flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-card p-4 text-left hover:border-primary/40 hover:bg-accent/40 transition-all group"
              >
                {/* Lock badge */}
                <span className="absolute top-2.5 right-2.5">
                  <Lock size={10} className="text-muted-foreground/40" />
                </span>

                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${bg}`}>
                  {isUploading
                    ? <Loader2 size={18} className={`${color} animate-spin`} />
                    : <Icon size={18} className={color} />
                  }
                </div>

                <div className="w-full">
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  {doc ? (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{doc.file_name}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                      <Plus size={10} /> Add document
                    </p>
                  )}
                </div>

                {doc && (
                  <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                    <Eye size={10} /> View
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {docs.length} of {CATEGORIES.length} documents uploaded
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Document viewer */}
      <Dialog open={!!viewingDoc} onOpenChange={(o) => { if (!o) { setViewingDoc(null); setViewUrl(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {CATEGORIES.find((c) => c.key === viewingDoc?.document_type)?.label}
            </DialogTitle>
          </DialogHeader>
          {viewUrl ? (
            viewUrl.match(/\.(pdf)$/i) ? (
              <iframe src={viewUrl} className="w-full h-[60vh] rounded border border-border" title="Document" />
            ) : (
              <img src={viewUrl} alt="Document" className="w-full rounded border border-border object-contain max-h-[60vh]" />
            )
          ) : (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
