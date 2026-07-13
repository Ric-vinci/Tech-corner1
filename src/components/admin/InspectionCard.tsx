"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { TradeInSubmission } from "@/lib/trade-in/types";

const GRADES = ["Pristine", "Excellent", "Good", "Fair"];

/** Storage embedded in the product name, e.g. "… - A226B 64GB" → "64GB". */
function deriveStorage(name: string): string {
  return name.match(/(\d+)\s?(GB|TB)/i)?.[0]?.replace(/\s/g, "").toUpperCase() ?? "";
}

function defaultGrade(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("no_power") || c.includes("no power") || c.includes("dead")) return "Fair";
  if (c.includes("faulty") || c.includes("damage") || c.includes("broken")) return "Fair";
  return "Good";
}

type Props = {
  submission: TradeInSubmission;
  modelImage: string | null;
  onUpdated: (next: TradeInSubmission) => void;
};

export default function InspectionCard({ submission, modelImage, onUpdated }: Props) {
  // Pre-fill sensible defaults; the model image is the default photo.
  const [grade, setGrade] = useState(submission.grade ?? defaultGrade(submission.condition));
  const [battery, setBattery] = useState(submission.battery_health != null ? String(submission.battery_health) : "100");
  const [colour, setColour] = useState(submission.colour ?? "");
  const [storage, setStorage] = useState(submission.storage ?? deriveStorage(submission.product_name));
  const [imei, setImei] = useState(submission.imei ?? "");
  const [photos, setPhotos] = useState(
    (submission.inspection_photos && submission.inspection_photos.length
      ? submission.inspection_photos
      : modelImage
        ? [modelImage]
        : []
    ).join("\n"),
  );
  const [notes, setNotes] = useState(submission.inspection_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const photoList = photos.split("\n").map((s) => s.trim()).filter(Boolean);
  const complete = Boolean(grade && storage && colour && photoList.length);

  async function save() {
    setSaving(true);
    setMsg(null);
    setFailed(false);
    try {
      const res = await fetch(`/api/admin/trade-in/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection: {
            grade,
            batteryHealth: battery ? Number(battery) : null,
            colour: colour || null,
            storage: storage || null,
            imei: imei || null,
            photos: photoList,
            notes: notes || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      onUpdated(data.submission);
      setMsg("Inspection saved.");
    } catch (err) {
      setFailed(true);
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-grey-light bg-grey-lightest px-3 py-2 text-sm outline-none transition focus:border-black focus:bg-pure-white";

  return (
    <section className="rounded-2xl border border-grey-light bg-pure-white">
      <div className="flex items-center justify-between border-b border-grey-light px-5 py-3.5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-grey-dark">Inspection details</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${complete ? "bg-green-light text-green" : "bg-amber-50 text-amber-700"}`}>
          {complete ? "Complete" : "Incomplete"}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-grey-dark">Grade</span>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass}>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-grey-dark">Battery health (%)</span>
            <input type="number" min={0} max={100} value={battery} onChange={(e) => setBattery(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-grey-dark">Colour</span>
            <input value={colour} onChange={(e) => setColour(e.target.value)} placeholder="e.g. Black" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-grey-dark">Storage</span>
            <input value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="e.g. 128GB" className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-grey-dark">IMEI</span>
            <input value={imei} onChange={(e) => setImei(e.target.value)} className={inputClass} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-grey-dark">Photos (one URL per line — model image is the default)</span>
          <textarea value={photos} onChange={(e) => setPhotos(e.target.value)} rows={3} className={`${inputClass} font-mono text-xs`} />
        </label>
        {photoList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photoList.slice(0, 6).map((url, i) => (
              <img key={`${i}-${url}`} src={url} alt="" className="h-14 w-14 rounded-lg border border-grey-light object-contain" />
            ))}
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-grey-dark">Inspection notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Scratches, faults, accessories…" className={inputClass} />
        </label>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-grey-dark">
            {submission.inspected_at
              ? `Last inspected ${new Date(submission.inspected_at).toLocaleString("en-GB")}${submission.inspected_by ? ` by ${submission.inspected_by}` : ""}`
              : "Not yet inspected"}
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className={`text-sm ${failed ? "text-red-600" : "text-green"}`}>{msg}</span>}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-pure-white transition hover:bg-black-off disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save inspection"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
