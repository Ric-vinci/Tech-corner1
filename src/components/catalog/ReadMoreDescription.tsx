"use client";

import { useState } from "react";

export default function ReadMoreDescription({ paragraphs }: { paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mt-12 border-t border-grey-light pt-10">
      <div className={`space-y-4 text-grey-dark leading-7 md:text-lg md:leading-8 ${expanded ? "" : "max-h-32 overflow-hidden md:max-h-none"}`}>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-4 text-sm font-medium text-mode-primary hover:underline md:hidden"
      >
        {expanded ? "Read Less" : "Read More"}
      </button>
    </section>
  );
}
