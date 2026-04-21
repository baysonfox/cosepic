"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface EntityFieldOption {
  label: string;
  value: string;
}

export interface EntityFieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: EntityFieldOption[];
}

interface EntityFormDialogProps {
  open: boolean;
  title: string;
  description: string;
  fields: EntityFieldDef[];
  values: Record<string, string>;
  errorMessage?: string | null;
  submitting: boolean;
  submitLabel: string;
  onOpenChange: (open: boolean) => void;
  onValueChange: (name: string, value: string) => void;
  onSubmit: () => void | Promise<void>;
}

export function EntityFormDialog({
  open,
  title,
  description,
  fields,
  values,
  errorMessage,
  submitting,
  submitLabel,
  onOpenChange,
  onValueChange,
  onSubmit,
}: EntityFormDialogProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const mergedError = useMemo(
    () => validationError ?? errorMessage ?? null,
    [errorMessage, validationError],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const missingField = fields.find(
      (field) => field.required && !String(values[field.name] ?? "").trim(),
    );
    if (missingField) {
      setValidationError(`${missingField.label} is required.`);
      return;
    }

    setValidationError(null);
    await onSubmit();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {fields.map((field) => {
            const value = values[field.name] ?? "";

            return (
              <label key={field.name} className="block space-y-2">
                <span className="text-sm font-medium">{field.label}</span>

                {field.type === "text" && (
                  <Input
                    value={value}
                    onChange={(event) => onValueChange(field.name, event.target.value)}
                    placeholder={field.placeholder}
                  />
                )}

                {field.type === "textarea" && (
                  <Textarea
                    value={value}
                    onChange={(event) => onValueChange(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                  />
                )}

                {field.type === "select" && (
                  <Select
                    value={value || null}
                    onValueChange={(nextValue) =>
                      onValueChange(field.name, String(nextValue ?? ""))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={field.placeholder ?? `Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((option) => (
                        <SelectItem key={`${field.name}-${option.value}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </label>
            );
          })}

          {mergedError && <p className="text-sm text-destructive">{mergedError}</p>}

          <DialogFooter className="px-0 pb-0 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
