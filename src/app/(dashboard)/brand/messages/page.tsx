"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useConversations, useMessages } from "@/hooks/useConversations";

function BrandMessages() {
  const { conversations, loading, refetch } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { messages, send } = useMessages(activeId);
  const [draft, setDraft] = useState("");
  const searchParams = useSearchParams();

  // Deep-link support: /brand/messages?campaignId=... selects the
  // conversation for that campaign once conversations have loaded, so the
  // "message" action elsewhere in the app (e.g. an accepted bid) can open
  // the right thread instead of landing on an empty picker.
  useEffect(() => {
    if (activeId || loading || conversations.length === 0) return;
    const campaignId = searchParams.get("campaignId");
    if (!campaignId) return;
    const match = conversations.find((c) => c.campaign?._id === campaignId);
    if (match) setActiveId(match._id);
  }, [activeId, loading, conversations, searchParams]);

  const active = conversations.find((c) => c._id === activeId);

  const onSend = async () => {
    if (!draft.trim()) return;
    await send(draft.trim());
    setDraft("");
    refetch();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>
      <div className="grid md:grid-cols-3 gap-6 h-[70vh]">
        <div className="md:col-span-1 rounded-xl border border-slate-100 bg-white overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No conversations yet. Once you accept a creator's application, you can chat here.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveId(c._id)}
                className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 ${activeId === c._id ? "bg-indigo-50" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-slate-900">{c.otherUser.name}</span>
                  {c.unreadCount > 0 && <span className="bg-indigo-600 text-white text-[10px] rounded-full px-1.5 py-0.5">{c.unreadCount}</span>}
                </div>
                {c.campaign && <div className="text-xs text-indigo-600">{c.campaign.title}</div>}
                <div className="text-xs text-slate-500 truncate mt-1">{c.lastMessage?.body || "No messages yet"}</div>
              </button>
            ))
          )}
        </div>

        <div className="md:col-span-2 rounded-xl border border-slate-100 bg-white flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Select a conversation</div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-100 font-semibold text-slate-900">{active.otherUser.name}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m._id} className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${m.isMine ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSend()}
                  placeholder="Type a message..."
                  className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button onClick={onSend} className="px-4 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandMessagesPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto text-sm text-slate-400">Loading...</div>}>
      <BrandMessages />
    </Suspense>
  );
}
