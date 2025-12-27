"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MedicalReport } from "@/lib/actions";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MedicalReport | null;
}

export function DocumentViewerModal({ isOpen, onClose, report }: DocumentViewerModalProps) {
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50/50">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-slate-900 truncate">
                {report.name}
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <span>{report.date}</span>
                <span>•</span>
                <span>{report.size}</span>
                <span>•</span>
                <span className="capitalize">{report.type.split("/")[1] || "Document"}</span>
              </DialogDescription>
            </div>
            {report.file_url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0 hidden sm:flex"
                onClick={() => report.file_url && window.open(report.file_url, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                Open Original
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-white relative">
          {report.extracted_text ? (
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto px-8 py-8">
                <article className="prose prose-slate prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-th:bg-slate-100 prose-th:p-3 prose-td:p-3 prose-td:border-b max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.extracted_text}</ReactMarkdown>
                </article>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Preview Available</h3>
              <p className="text-slate-500 max-w-md mb-6">
                This document currently does not have an extracted text preview. You can view the
                original file by downloading it or opening it in a new tab.
              </p>
              {report.file_url ? (
                <Button onClick={() => report.file_url && window.open(report.file_url, "_blank")}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Original File
                </Button>
              ) : (
                <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-md">
                  Original file not available
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 sm:justify-between flex-row items-center gap-4">
          <p className="text-xs text-slate-400 hidden sm:block">ID: {report.id}</p>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {report.file_url && (
              <Button
                className="sm:hidden"
                onClick={() => report.file_url && window.open(report.file_url, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
