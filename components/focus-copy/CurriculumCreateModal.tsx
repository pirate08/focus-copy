"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SUBJECT_ICONS } from "@/types";

export type CurriculumModalType = "subject" | "chapter" | "topic";

type CurriculumCreateModalProps = {
  open: boolean;
  type: CurriculumModalType;
  subjectId?: string | null;
  parentId?: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    icon?: string;
    subjectId?: string;
    parentId?: string | null;
  }) => Promise<void> | void;
};

const titles: Record<CurriculumModalType, string> = {
  subject: "Add a new subject",
  chapter: "Add a new chapter",
  topic: "Add a new topic",
};

const descriptions: Record<CurriculumModalType, string> = {
  subject: "Create a subject to start building your UPSC curriculum.",
  chapter: "Create a chapter under the selected subject.",
  topic: "Create a topic under the selected chapter.",
};

export function CurriculumCreateModal({
  open,
  type,
  subjectId,
  parentId,
  onClose,
  onSubmit,
}: CurriculumCreateModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("book-open");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setIcon("book-open");
      setErrorMessage("");
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      const msg = "Please enter a name before saving.";
      setErrorMessage(msg);
      try {
        toast.error(msg);
      } catch (e) {
        /* noop */
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        icon: type === "subject" ? icon : undefined,
        subjectId: subjectId ?? undefined,
        parentId: parentId ?? null,
      });
      setName("");
      setErrorMessage("");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save this item.";
      setErrorMessage(message);
      try {
        toast.error(message);
      } catch (e) {
        /* noop */
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{titles[type]}</DialogTitle>
            <DialogDescription>{descriptions[type]}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {type === "subject" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Icon
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SUBJECT_ICONS.map((subjectIcon) => (
                    <button
                      key={subjectIcon}
                      type="button"
                      onClick={() => setIcon(subjectIcon)}
                      className={`rounded-md border px-2 py-2 text-xs font-medium transition ${
                        icon === subjectIcon
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {subjectIcon}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {type === "subject"
                  ? "Subject name"
                  : type === "chapter"
                    ? "Chapter name"
                    : "Topic name"}
              </label>
              <input
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder={
                  type === "subject"
                    ? "e.g. Geography"
                    : type === "chapter"
                      ? "e.g. Physical Geography"
                      : "e.g. Monsoon"
                }
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-offset-white transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {errorMessage && (
              <p className="text-xs font-medium text-red-600">{errorMessage}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
