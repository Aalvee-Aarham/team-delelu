import { useRef } from "react";
import { ImagePlus, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFileUpload } from "@/hooks/useUpload";

export function ImagePicker({
  value,
  onChange,
  provider,
  label = "Cover image",
  hint = "Paste an Unsplash link, or upload your own.",
}: {
  value: string;
  onChange: (url: string, provider: "unsplash" | "uploadthing" | "local") => void;
  provider: "uploadthing" | "local";
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadImage } = useFileUpload();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const uploaded = await uploadImage(file);
    if (uploaded) onChange(uploaded.url, provider);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="cover-url">{label}</Label>

      {value && (
        <img
          src={value}
          alt=""
          className="h-32 w-full rounded-md border border-ink/12 object-cover"
        />
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="cover-url"
            className="pl-8"
            placeholder="https://images.unsplash.com/photo-…"
            value={value}
            onChange={(e) => onChange(e.target.value, "unsplash")}
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void pick(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus />
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>

      <p className="text-[12px] text-muted-foreground">
        {hint} Uploads go to {provider}.
      </p>
    </div>
  );
}
