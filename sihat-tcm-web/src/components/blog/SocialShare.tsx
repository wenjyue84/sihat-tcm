"use client";

import { Button } from "@/components/ui/button";
import { Facebook, Link as LinkIcon, MessageCircle, Twitter } from "lucide-react";
import { toast } from "sonner";

interface SocialShareProps {
  url: string;
  title: string;
}

export function SocialShare({ url, title }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-4 py-6 border-t border-b border-stone-100 my-8">
      <span className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
        Share this article
      </span>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-[#25D366] hover:bg-[#25D366]/90 border-none text-white w-10 h-10"
          onClick={() => window.open(shareLinks.whatsapp, "_blank")}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="sr-only">Share on WhatsApp</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-[#1877F2] hover:bg-[#1877F2]/90 border-none text-white w-10 h-10"
          onClick={() => window.open(shareLinks.facebook, "_blank")}
        >
          <Facebook className="w-5 h-5" />
          <span className="sr-only">Share on Facebook</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-[#000000] hover:bg-[#000000]/90 border-none text-white w-10 h-10"
          onClick={() => window.open(shareLinks.twitter, "_blank")}
        >
          <Twitter className="w-5 h-5" />
          <span className="sr-only">Share on X</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full hover:bg-stone-100 w-10 h-10 border-stone-200 text-stone-600"
          onClick={copyToClipboard}
        >
          <LinkIcon className="w-5 h-5" />
          <span className="sr-only">Copy Link</span>
        </Button>
      </div>
    </div>
  );
}
