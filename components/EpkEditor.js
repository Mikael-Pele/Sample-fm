import { useEffect, useRef, useState } from "react";
import EpkPublicView from "./EpkPublicView";
import { Field, ErrorNote, SuccessNote, INPUT_CLASS, PrimaryButton, SecondaryButton, ReadOnlyNotice, requestJson } from "./DashboardForms";
import { EPK_SECTIONS, MAX_PRESS_QUOTES } from "../lib/epkSections";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full shrink-0 transition disabled:opacity-60 ${checked ? "bg-brand" : "bg-base-border"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

// EPK editor with a live preview of the public page beside it.
export default function EpkEditor({ canEdit, onUpgrade, onSaved }) {
  const [epk, setEpk] = useState(null);
  const [stats, setStats] = useState({ clicks: 0, releases: 0, platforms: [] });
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    requestJson("/api/epk")
      .then((data) => {
        setEpk(data.epk);
        setStats(data.stats);
        setSaved(data.saved);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  if (loadError) return <ErrorNote>{loadError}</ErrorNote>;
  if (!epk) return <div className="glass-card rounded-xl2 p-10 text-center text-sm text-base-muted">Loading your press kit…</div>;

  const publicPath = `/epk/${epk.handle}`;
  const publicUrl = `${APP_URL || (typeof window !== "undefined" ? window.location.origin : "")}${publicPath}`;

  function set(field, value) {
    setEpk((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
  }

  function setVisible(key, value) {
    setEpk((prev) => ({ ...prev, visibility: { ...prev.visibility, [key]: value } }));
    setSuccess("");
  }

  function setQuote(index, field, value) {
    set(
      "press_quotes",
      epk.press_quotes.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  async function handlePhoto(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data_url = await readFileAsDataUrl(file);
      const data = await requestJson("/api/upload/artwork", { method: "POST", body: JSON.stringify({ data_url }) });
      set("photo_url", data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function save(nextPublished) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body = { ...epk, published: nextPublished === undefined ? epk.published : nextPublished };
      const data = await requestJson("/api/epk", { method: "PUT", body: JSON.stringify(body) });
      setEpk(data.epk);
      setSaved(true);
      setSuccess(data.epk.published ? "Saved. Your EPK is live." : "Saved. Your EPK is not public yet.");
      if (onSaved) onSaved(data.epk);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      window.prompt("Copy your EPK link:", publicUrl);
    }
  }

  const disabled = !canEdit;

  return (
    <div className="space-y-5">
      {!canEdit && <ReadOnlyNotice onUpgrade={onUpgrade} />}

      <div className="glass-card rounded-xl2 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            {epk.published && saved ? "Your EPK is public" : "Your EPK is private"}
          </div>
          <div className="text-xs text-base-muted truncate">
            {epk.published && saved ? publicUrl.replace(/^https?:\/\//, "") : "Publish it when you're ready to share it with press and promoters."}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {epk.published && saved && (
            <>
              <SecondaryButton type="button" onClick={copyLink}>
                {copied ? "Copied" : "Copy link"}
              </SecondaryButton>
              <a href={publicPath} target="_blank" rel="noopener noreferrer" className="bg-base-card border border-base-border hover:border-base-muted transition text-fg font-semibold rounded-lg px-4 py-2.5 text-sm">
                View
              </a>
            </>
          )}
          <PrimaryButton type="button" disabled={disabled || saving} onClick={() => save(!(epk.published && saved))}>
            {epk.published && saved ? "Unpublish" : "Publish"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 items-start">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="glass-card rounded-xl2 p-5 sm:p-6 space-y-6 min-w-0"
        >
          <section className="space-y-4">
            <h2 className="text-lg font-bold">Profile</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Artist name" htmlFor="epk-name">
                <input id="epk-name" value={epk.display_name || ""} onChange={(e) => set("display_name", e.target.value)} maxLength={80} disabled={disabled} className={INPUT_CLASS} />
              </Field>
              <Field label="EPK link" htmlFor="epk-handle" hint={`droppa.fm/epk/${epk.handle || "yourname"}`}>
                <input
                  id="epk-handle"
                  value={epk.handle}
                  onChange={(e) => set("handle", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  maxLength={40}
                  disabled={disabled}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-base-bg border border-base-border shrink-0">
                {epk.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={epk.photo_url} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="hidden" />
              <SecondaryButton type="button" disabled={disabled || uploading} onClick={() => fileRef.current && fileRef.current.click()}>
                {uploading ? "Uploading…" : epk.photo_url ? "Change photo" : "Upload photo"}
              </SecondaryButton>
              {epk.photo_url && !disabled && (
                <button type="button" onClick={() => set("photo_url", null)} className="text-xs text-base-muted hover:text-fg">
                  Remove
                </button>
              )}
            </div>
            <Field label="Bio" htmlFor="epk-bio">
              <textarea id="epk-bio" rows={6} value={epk.bio || ""} onChange={(e) => set("bio", e.target.value)} maxLength={2000} disabled={disabled} className={INPUT_CLASS} placeholder="Who you are, your sound, notable releases and shows." />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Monthly streams" htmlFor="epk-streams" hint="Shown as self-reported. Droppa doesn't check this number.">
                <input
                  id="epk-streams"
                  inputMode="numeric"
                  value={epk.monthly_streams ?? ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, "");
                    set("monthly_streams", digits === "" ? null : Number(digits));
                  }}
                  placeholder="250000"
                  disabled={disabled}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Booking contact" htmlFor="epk-booking" hint="An email address or a link">
                <input
                  id="epk-booking"
                  value={(epk.booking_contact || "").replace(/^mailto:/, "")}
                  onChange={(e) => set("booking_contact", e.target.value)}
                  placeholder="bookings@yourname.com"
                  disabled={disabled}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Press quotes</h2>
              {!disabled && epk.press_quotes.length < MAX_PRESS_QUOTES && (
                <button type="button" onClick={() => set("press_quotes", [...epk.press_quotes, { quote: "", source: "" }])} className="text-xs font-semibold text-brand-light hover:text-brand">
                  Add quote
                </button>
              )}
            </div>
            {epk.press_quotes.length === 0 && <p className="text-sm text-base-muted">No press quotes yet.</p>}
            {epk.press_quotes.map((q, i) => (
              <div key={i} className="bg-base-bg border border-base-border rounded-lg p-3 space-y-2">
                <textarea rows={2} aria-label={`Quote ${i + 1}`} value={q.quote || ""} onChange={(e) => setQuote(i, "quote", e.target.value)} maxLength={400} placeholder="What they said" disabled={disabled} className={INPUT_CLASS} />
                <div className="flex gap-2">
                  <input aria-label={`Quote ${i + 1} source`} value={q.source || ""} onChange={(e) => setQuote(i, "source", e.target.value)} maxLength={80} placeholder="Publication or writer" disabled={disabled} className={INPUT_CLASS} />
                  {!disabled && (
                    <button type="button" onClick={() => set("press_quotes", epk.press_quotes.filter((_, j) => j !== i))} className="text-xs text-base-muted hover:text-red-400 px-2 shrink-0">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">Show on public page</h2>
              <p className="text-xs text-base-muted mt-0.5">
                Clicks, releases and platforms are counted by Droppa and labelled verified. Everything else is labelled self-reported.
              </p>
            </div>
            <div className="divide-y divide-base-border/60 border border-base-border rounded-lg">
              {EPK_SECTIONS.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className={`text-[11px] ${s.verified ? "text-emerald-400" : "text-base-muted"}`}>
                      {s.verified ? "Verified by Droppa" : s.key === "photo" || s.key === "bio" || s.key === "booking" ? "Entered by you" : "Self-reported"}
                    </div>
                  </div>
                  <Toggle checked={Boolean(epk.visibility[s.key])} onChange={(v) => setVisible(s.key, v)} disabled={disabled} label={`Show ${s.label}`} />
                </div>
              ))}
            </div>
          </section>

          <ErrorNote>{error}</ErrorNote>
          <SuccessNote>{success}</SuccessNote>
          <PrimaryButton type="submit" disabled={disabled || saving || uploading}>
            {saving ? "Saving…" : "Save EPK"}
          </PrimaryButton>
        </form>

        <section className="glass-card rounded-xl2 overflow-hidden min-w-0 xl:sticky xl:top-20">
          <div className="px-4 sm:px-5 py-3 border-b border-base-border text-xs font-semibold text-base-muted uppercase tracking-wide">
            Preview
          </div>
          <div className="p-5 sm:p-7 bg-base-bg">
            <EpkPublicView epk={epk} stats={stats} />
          </div>
        </section>
      </div>
    </div>
  );
}
