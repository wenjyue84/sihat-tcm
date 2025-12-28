"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { usePatientCommunication } from "./communication/hooks/usePatientCommunication";
import { RequestList } from "./communication/components/RequestList";
import { ChatArea } from "./communication/components/ChatArea";

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
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 md:p-6 max-h-[calc(100vh-4rem)]">
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
  );
}
