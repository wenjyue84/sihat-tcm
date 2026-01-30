export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getSupportedMimeType(): string {
  const types = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm";
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "none":
      return "text-emerald-600 bg-emerald-100";
    case "mild":
      return "text-yellow-600 bg-yellow-100";
    case "moderate":
      return "text-orange-600 bg-orange-100";
    case "severe":
      return "text-red-600 bg-red-100";
    default:
      return "text-slate-600 bg-slate-100";
  }
}
