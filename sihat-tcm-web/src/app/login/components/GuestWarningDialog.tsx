"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GuestWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  translations: {
    title: string;
    message: string;
    cancel: string;
    understand: string;
  };
}

export function GuestWarningDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  translations,
}: GuestWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
          <DialogDescription className="pt-2">{translations.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {translations.cancel}
          </Button>
          <Button onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700">
            {translations.understand}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
