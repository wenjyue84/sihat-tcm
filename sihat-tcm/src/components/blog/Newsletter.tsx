"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      toast.success("Thanks for subscribing!");
      setEmail("");
    }, 1500);
  };

  if (status === "success") {
    return (
      <div className="bg-emerald-900 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden my-12">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-serif text-3xl font-bold mb-4">You're on the list!</h3>
          <p className="text-emerald-100 text-lg max-w-md mx-auto">
            Get ready for weekly TCM wisdom, healthy recipes, and exclusive health tips delivered to
            your inbox.
          </p>
          <Button
            variant="ghost"
            className="mt-6 text-white hover:text-emerald-200 hover:bg-white/10"
            onClick={() => setStatus("idle")}
          >
            Subscribe another email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-900 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden my-12 shadow-xl">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium mb-6 backdrop-blur-sm border border-emerald-500/30">
          <Mail className="w-4 h-4" />
          <span>Weekly TCM Insights</span>
        </div>

        <h3 className="font-serif text-3xl md:text-4xl font-bold mb-4">
          Unlock Ancient Wisdom for Modern Life
        </h3>
        <p className="text-stone-300 text-lg mb-8 max-w-lg mx-auto">
          Join 10,000+ Malaysians learning to balance their heat, improve sleep, and eat healthier
          with TCM.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email address"
            className="bg-white/10 border-white/20 text-white placeholder:text-stone-400 h-12 rounded-lg focus:border-emerald-500 focus:ring-emerald-500"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 rounded-lg transition-all"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Joining..." : "Subscribe Free"}
          </Button>
        </form>
        <p className="text-stone-500 text-sm mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  );
}
