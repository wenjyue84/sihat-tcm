/**
 * Chat Area Component
 * Displays messages and handles message input
 */

import { format } from "date-fns";
import { MessageSquare, Send, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { VerificationRequest, Message } from "../hooks/usePatientCommunication";

interface ChatAreaProps {
  activeRequest: VerificationRequest | null;
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  sending: boolean;
  onCreateRequest: () => void;
}

export function ChatArea({
  activeRequest,
  newMessage,
  onMessageChange,
  onSendMessage,
  sending,
  onCreateRequest,
}: ChatAreaProps) {
  if (!activeRequest) {
    return (
      <div className="w-full md:w-2/3">
        <Card className="h-full flex flex-col bg-white/90 backdrop-blur shadow-sm">
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-gray-600">Select a conversation</h3>
            <p>or start a new verification request</p>

            <Button
              onClick={onCreateRequest}
              disabled={sending}
              className="mt-6 bg-emerald-600 hover:bg-emerald-700"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Request Verification
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full md:w-2/3">
      <Card className="h-full flex flex-col bg-white/90 backdrop-blur shadow-sm">
        <CardHeader className="border-b pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Doctor
              </CardTitle>
              <CardDescription>
                {activeRequest.status === "pending"
                  ? "Waiting for doctor response..."
                  : "Online"}
              </CardDescription>
            </div>
            {activeRequest.status === "active" && (
              <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Chat Active
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          {/* Initial system message */}
          <div className="flex justify-center">
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              Request created on {format(new Date(activeRequest.created_at), "PPP p")}
            </span>
          </div>

          {activeRequest.messages.map((msg: Message, idx: number) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    msg.role === "user" ? "text-emerald-100" : "text-gray-400"
                  }`}
                >
                  {format(new Date(msg.timestamp), "h:mm a")}
                </p>
              </div>
            </div>
          ))}

          {activeRequest.status === "pending" && activeRequest.messages.length === 0 && (
            <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-100 mx-auto max-w-sm mt-8">
              <Loader2 className="w-8 h-8 text-yellow-500 mx-auto mb-2 animate-spin" />
              <p className="text-yellow-800 font-medium">Verification Pending</p>
              <p className="text-yellow-600 text-sm mt-1">
                Your request has been sent to the doctor. You will be able to chat once they verify
                your request.
              </p>
            </div>
          )}
        </CardContent>
        <div className="p-3 border-t bg-gray-50/50">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder={
                activeRequest.status === "pending"
                  ? "Waiting for response..."
                  : "Type a message..."
              }
              disabled={activeRequest.status === "pending" || sending}
              onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
              className="bg-white"
            />
            <Button
              onClick={onSendMessage}
              disabled={activeRequest.status === "pending" || sending || !newMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}


