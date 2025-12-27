"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";

export default function ViewMedicalReportPage() {
  const router = useRouter();
  const [reportContent, setReportContent] = useState<string>("");
  const [reportName, setReportName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load report from localStorage
    const savedReport = localStorage.getItem("viewMedicalReport");
    if (savedReport) {
      try {
        const { name, content } = JSON.parse(savedReport);
        setReportName(name);
        setReportContent(content);
      } catch (e) {
        console.error("Failed to parse saved report:", e);
      }
    }
    setLoading(false);
  }, []);

  const handleDownload = () => {
    // Create a blob from the markdown content
    const blob = new Blob([reportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = reportName.replace(".pdf", ".md");
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    router.push("/patient");
  };

  // Simple markdown to HTML converter for basic formatting
  const renderMarkdown = (md: string) => {
    if (!md) return "";

    // Split into lines for processing
    let html = md;

    // Headers
    html = html.replace(
      /^### (.*$)/gim,
      '<h3 class="text-lg font-semibold text-stone-800 mt-6 mb-3">$1</h3>'
    );
    html = html.replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-bold text-stone-900 mt-8 mb-4 pb-2 border-b border-stone-200">$1</h2>'
    );
    html = html.replace(
      /^# (.*$)/gim,
      '<h1 class="text-3xl font-bold text-stone-900 mb-6">$1</h1>'
    );

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-stone-900">$1</strong>'
    );
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="my-8 border-stone-200" />');

    // Lists
    html = html.replace(/^\- (.+)$/gim, '<li class="ml-6 text-stone-700">$1</li>');
    html = html.replace(/^\d+\. (.+)$/gim, '<li class="ml-6 text-stone-700">$1</li>');

    // Tables - basic support
    const lines = html.split("\n");
    let inTable = false;
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line is a table row
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        if (!inTable) {
          processedLines.push(
            '<div class="overflow-x-auto my-6"><table class="min-w-full divide-y divide-stone-200 border border-stone-200">'
          );
          inTable = true;
        }

        // Check if this is a separator line
        if (line.includes("---") || line.includes("===")) {
          continue; // Skip separator lines
        }

        const cells = line.split("|").filter((cell) => cell.trim() !== "");
        const isHeader = i === 0 || (lines[i - 1] && !lines[i - 1].includes("|"));

        if (isHeader && !processedLines.some((l) => l.includes("<thead"))) {
          processedLines.push('<thead class="bg-stone-50">');
          processedLines.push("<tr>");
          cells.forEach((cell) => {
            processedLines.push(
              `<th class="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider border-r border-stone-200 last:border-r-0">${cell.trim()}</th>`
            );
          });
          processedLines.push("</tr>");
          processedLines.push("</thead>");
          processedLines.push('<tbody class="bg-white divide-y divide-stone-200">');
        } else {
          processedLines.push('<tr class="hover:bg-stone-50">');
          cells.forEach((cell) => {
            processedLines.push(
              `<td class="px-4 py-3 text-sm text-stone-700 border-r border-stone-200 last:border-r-0">${cell.trim()}</td>`
            );
          });
          processedLines.push("</tr>");
        }
      } else {
        if (inTable) {
          processedLines.push("</tbody></table></div>");
          inTable = false;
        }
        processedLines.push(line);
      }
    }

    if (inTable) {
      processedLines.push("</tbody></table></div>");
    }

    html = processedLines.join("\n");

    // Paragraphs (lines that don't start with HTML tags)
    html = html.replace(
      /^(?!<[^>]+>)(.+)$/gim,
      '<p class="text-stone-700 leading-relaxed my-2">$1</p>'
    );

    return html;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600">Loading report...</p>
      </div>
    );
  }

  if (!reportContent) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center flex-col gap-4">
        <FileText className="w-16 h-16 text-stone-300" />
        <p className="text-stone-600">No report to display</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="text-stone-600 hover:text-stone-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-stone-900">{reportName}</h1>
              <p className="text-sm text-stone-500">Medical Report</p>
            </div>
          </div>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download .md
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg border border-stone-200 p-8 md:p-12">
          <div
            className="prose prose-stone max-w-none medical-report-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(reportContent) }}
          />
        </div>
      </div>

      <style jsx global>{`
        .medical-report-content ul {
          list-style-type: disc;
          margin: 1rem 0;
        }
        .medical-report-content ol {
          list-style-type: decimal;
          margin: 1rem 0;
        }
        .medical-report-content li {
          margin: 0.5rem 0;
        }
        .medical-report-content table {
          border-collapse: collapse;
          width: 100%;
        }
        .medical-report-content th,
        .medical-report-content td {
          text-align: left;
        }
        .medical-report-content code {
          background-color: #f5f5f4;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
}
