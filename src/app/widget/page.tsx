"use client";

import ChatWidget from "@/components/ChatWidget";

export default function WidgetPage() {
  return (
    <div className="fixed inset-0 flex items-end justify-end p-0 bg-transparent">
      <ChatWidget />
    </div>
  );
}
