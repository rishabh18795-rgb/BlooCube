"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import OfficeAdminLayout from "@/Components/OfficeAdmin/OfficeAdminLayout";

type ContactMessage = { id: string; name: string; email: string; subject: string | null; message: string; createdAt: string };

export default function OfficeContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiRequest<{ success: boolean; data: { messages: ContactMessage[] } }>("/api/contact")
      .then((res) => setMessages(res.data.messages))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <OfficeAdminLayout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Contact Requests</h1>
      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load contact messages.</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-slate-400">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-900">{m.name} · {m.email}</span>
                <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              {m.subject && <div className="text-xs text-indigo-600 mt-1">{m.subject}</div>}
              <p className="text-sm text-slate-700 mt-2">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </OfficeAdminLayout>
  );
}
