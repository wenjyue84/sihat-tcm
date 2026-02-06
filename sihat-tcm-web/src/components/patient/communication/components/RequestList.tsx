/**
 * Request List Component
 * Displays list of verification requests
 */

import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { VerificationRequest } from "../hooks/usePatientCommunication";

interface RequestListProps {
  requests: VerificationRequest[];
  activeRequest: VerificationRequest | null;
  onSelectRequest: (request: VerificationRequest) => void;
  onCreateRequest: () => void;
  sending: boolean;
}

export function RequestList({
  requests,
  activeRequest,
  onSelectRequest,
  onCreateRequest,
  sending,
}: RequestListProps) {
  return (
    <div className="w-full md:w-1/3 flex flex-col gap-4">
      <Card className="flex-1 bg-white/80 backdrop-blur border-emerald-100 flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg text-emerald-800">Communication</CardTitle>
          <CardDescription>Chat with your doctor</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-2">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No active conversations.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                  activeRequest?.id === req.id
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white hover:bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-gray-700 truncate max-w-[140px]">
                    {req.summary || `Request #${req.id.slice(0, 4)}`}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(req.created_at), "MMM d")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {req.status === "active" ? "Active" : "Pending"}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
        <div className="p-4 border-t">
          {requests.length === 0 && (
            <Button
              onClick={onCreateRequest}
              disabled={sending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Request Verification
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
