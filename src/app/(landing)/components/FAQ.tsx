"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQS } from "./faqData";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <span className="inline-block text-xs font-semibold tracking-wide text-brand-indigo uppercase mb-2">
          FAQ
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-navy mb-8">Frequently asked questions</h2>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-sm text-[#111827]">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#667085] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && <p className="px-5 pb-4 text-sm text-[#667085]">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
