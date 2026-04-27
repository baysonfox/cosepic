import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PackEditControlsProps {
  editing: boolean;
  saving: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export function PackEditControls({
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
}: PackEditControlsProps) {
  if (!editing) {
    if (!onEdit) {
      return null;
    }

    return (
      <Button type="button" variant="outline" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" onClick={onSave} disabled={saving}>
        <Check className="h-4 w-4" />
        {saving ? "Saving..." : "Save"}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
        <X className="h-4 w-4" />
        Cancel
      </Button>
    </div>
  );
}
