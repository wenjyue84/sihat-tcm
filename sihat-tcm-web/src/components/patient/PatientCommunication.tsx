"use client";
import { useState, useEffect } from "react";
import { Loader2, Info, X, Bell, MessageSquare } from "lucide-react";
import { usePatientCommunication } from "./communication/hooks/usePatientCommunication";
import { RequestList } from "./communication/components/RequestList";
import { ChatArea } from "./communication/components/ChatArea";
import { AnimatePresence, motion } from "framer-motion";

export function PatientCommunication() {
  const {
    requests,
    activeRequest,
    loading,
    sending,
    setActiveRequest,
    createRequest,
    sendMessage,
  } = usePatientCommunication();

  const [newMessage, setNewMessage] = useState("");
  const [showHelp, setShowHelp] = useState(true);
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);

  // Listen for doctor replies
  useEffect(() => {
    const handleReply = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setNotification({
        title: "New Message from Doctor",
        message: detail.message,
      });
      // Auto dismiss
      setTimeout(() => setNotification(null), 5000);
    };

    window.addEventListener("doctor-reply", handleReply);
    return () => window.removeEventListener("doctor-reply", handleReply);
  }, []);

  const handleCreateRequest = async () => {
    try {
      await createRequest();
    } catch (error) {
      alert("Failed to create request. Please try again.");
    }
  };

  const handleSendMessage = async () => {
    if (!activeRequest || !newMessage.trim()) return;

    try {
      await sendMessage(activeRequest.id, newMessage);
      setNewMessage("");
    } catch (error) {
      alert("Failed to send message.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:p-6 max-h-[calc(100vh-4rem)] relative">
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, right: 20 }}
            animate={{ opacity: 1, y: 0, right: 20 }}
            exit={{ opacity: 0, y: -20, right: 20 }}
            className="absolute top-4 z-50 bg-white border border-emerald-100 shadow-xl rounded-xl p-4 w-80 pointer-events-none"
          >
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <Bell className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 text-sm">{notification.title}</h4>
                <p className="text-slate-600 text-xs line-clamp-2">{notification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Banner */}
      {showHelp && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-start justify-between">
          <div className="flex gap-3">
            <div className="bg-blue-100 p-2 rounded-lg h-fit">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 text-sm mb-1">
                How Doctor Communication Works
              </h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Request a verification for your AI Diagnosis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Wait for the doctor to review your case (usually 24-48 hours)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Once verified, you can chat directly with the doctor here
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="text-blue-400 hover:text-blue-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        <RequestList
          requests={requests}
          activeRequest={activeRequest}
          onSelectRequest={setActiveRequest}
          onCreateRequest={handleCreateRequest}
          sending={sending}
        />
        <ChatArea
          activeRequest={activeRequest}
          newMessage={newMessage}
          onMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          sending={sending}
          onCreateRequest={handleCreateRequest}
        />
      </div>
    </div>
  );
}
