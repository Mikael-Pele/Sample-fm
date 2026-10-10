import { useRef, useState } from "react";
import { Field, ErrorNote, INPUT_CLASS, PrimaryButton, SecondaryButton, ReadOnlyNotice, requestJson } from "./DashboardForms";

export const RELEASE_STATUS_META = {
  live: { label: "Live", className: "text-emerald-400 bg-emerald-950/40 border-emerald-900" },
  soon: { label: "Soon", className: "text-amber-400 bg-amber-950/40 border-amber-900" },
  draft: { label: "Draft", className: "text-base-muted bg-base-bg border-base-border" },
};

export function StatusPill({ status }) {
  const meta = RELEASE_STATUS_META[status] || RELEASE_STATUS_META.draft;
  return (
    <span className={`inline-block text-[11px] font-bold rounded-full border px-2.5 py-0.5 ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export function formatReleaseDate(value) {
  if (!value) return "No date yet";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const DISTRIBUTOR_SUGGESTIONS = [
  "DistroKid",
  "TuneCore",
  "CD Baby",
  "Amuse",
  "Ditto",
  "AudioSalad",
  "ONErpm",
  "Boomplay Music",
  "Audiomack Supporters",
  "Self-released",
];

const EMPTY = { title: "", status: "soon", distributor: "", release_date: "", artwork_url: "", link_url: "" };
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function ReleaseCover({ release, size = "w-10 h-10" }) {
  return (
    <span className={`${size} rounded-md bg-base-bg border border-base-border overflow-hidden shrink-0 block`}>
      {release.artwork_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={release.artwork_url} alt="" className="w-full h-full object-cover" />
      ) : null}
    </span>
  );
}
const FILTERS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "soon", label: "Soon" },
  { key: "draft", label: "Draft" },
];

// Release tracker: what's out, what's coming and through which distributor.
export default function ReleasesPage({ releases, onChange, canEdit, onUpgrade, links = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const origin = APP_URL || (typeof window !== "undefined" ? window.location.origin : "");

  // Picking one of the artist's SmartLinks fills the link and, if empty,
  // the title and cover art from it.
  function pickSmartLink(slug) {
    const link = links.find((l) => l.slug === slug);
    if (!link) return;
    setForm((prev) => ({
      ...prev,
      link_url: `${origin}/${link.slug}`,
      title: prev.title || link.track_title,
      artwork_url: prev.artwork_url || link.artwork_url || "",
    }));
  }

  async function handleCover(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data_url = await readFileAsDataUrl(file);
      const data = await requestJson("/api/upload/artwork", { method: "POST", body: JSON.stringify({ data_url }) });
      setForm((prev) => ({ ...prev, artwork_url: data.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, f.key === "all" ? releases.length : releases.filter((r) => r.status === f.key).length]));
  const shown = filter === "all" ? releases : releases.filter((r) => r.status === filter);

  function update(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function startEdit(release) {
    setEditingId(release.id);
    setForm({
      title: release.title,
      status: release.status,
      distributor: release.distributor || "",
      release_date: release.release_date || "",
      artwork_url: release.artwork_url || "",
      link_url: release.link_url || "",
    });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await requestJson(editingId ? `/api/releases/${editingId}` : "/api/releases", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onChange(
        editingId ? releases.map((r) => (r.id === editingId ? data.release : r)) : [data.release, ...releases]
      );
      cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(release) {
    if (!window.confirm(`Delete "${release.title}" from your releases?`)) return;
    try {
      await requestJson(`/api/releases/${release.id}`, { method: "DELETE" });
      onChange(releases.filter((r) => r.id !== release.id));
      if (editingId === release.id) cancelEdit();
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="space-y-5">
      {!canEdit && <ReadOnlyNotice onUpgrade={onUpgrade} />}

      <form onSubmit={handleSubmit} className="glass-card rounded-xl2 p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold">{editingId ? "Edit release" : "Add a release"}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Title" htmlFor="release-title" className="lg:col-span-2">
            <input
              id="release-title"
              name="title"
              value={form.title}
              onChange={update}
              required
              maxLength={160}
              placeholder="Song or project name"
              disabled={!canEdit}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Status" htmlFor="release-status">
            <select id="release-status" name="status" value={form.status} onChange={update} disabled={!canEdit} className={INPUT_CLASS}>
              <option value="live">Live</option>
              <option value="soon">Soon</option>
              <option value="draft">Draft</option>
            </select>
          </Field>
          <Field label="Release date" htmlFor="release-date">
            <input
              id="release-date"
              type="date"
              name="release_date"
              value={form.release_date}
              onChange={update}
              disabled={!canEdit}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Distributor" htmlFor="release-distributor" className="sm:col-span-2">
            <input
              id="release-distributor"
              name="distributor"
              value={form.distributor}
              onChange={update}
              list="distributor-suggestions"
              maxLength={80}
              placeholder="DistroKid, Amuse, Ditto…"
              disabled={!canEdit}
              className={INPUT_CLASS}
            />
            <datalist id="distributor-suggestions">
              {DISTRIBUTOR_SUGGESTIONS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field
            label="Link"
            htmlFor="release-link"
            className="sm:col-span-2"
            hint={links.length > 0 ? "Paste any link, or pick one of your SmartLinks." : "Where fans can listen or pre-save."}
          >
            <input
              id="release-link"
              name="link_url"
              value={form.link_url}
              onChange={update}
              maxLength={600}
              placeholder="droppa.fm/your-song"
              disabled={!canEdit}
              className={INPUT_CLASS}
            />
            {links.length > 0 && canEdit && (
              <select
                aria-label="Use one of your SmartLinks"
                value=""
                onChange={(e) => pickSmartLink(e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
              >
                <option value="">Use one of your SmartLinks…</option>
                {links.map((l) => (
                  <option key={l.id} value={l.slug}>
                    {l.track_title} (droppa.fm/{l.slug})
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Cover art" htmlFor="release-cover" className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <ReleaseCover release={form} size="w-14 h-14" />
              <input ref={fileRef} id="release-cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCover} className="hidden" />
              <SecondaryButton type="button" disabled={!canEdit || uploading} onClick={() => fileRef.current && fileRef.current.click()}>
                {uploading ? "Uploading…" : form.artwork_url ? "Change cover" : "Upload cover"}
              </SecondaryButton>
              {form.artwork_url && canEdit && (
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, artwork_url: "" }))} className="text-xs text-base-muted hover:text-fg">
                  Remove
                </button>
              )}
            </div>
          </Field>
        </div>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex gap-3">
          <PrimaryButton type="submit" disabled={saving || uploading || !canEdit}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Add release"}
          </PrimaryButton>
          {editingId && (
            <SecondaryButton type="button" onClick={cancelEdit}>
              Cancel
            </SecondaryButton>
          )}
        </div>
      </form>

      <section className="glass-card rounded-xl2 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-base-border">
          <h2 className="font-bold text-sm">Your releases</h2>
          <div role="group" aria-label="Filter by status" className="flex bg-base-bg border border-base-border rounded-lg p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                  filter === f.key ? "bg-brand text-white" : "text-base-muted hover:text-fg"
                }`}
              >
                {f.label} <span className="opacity-70">{counts[f.key]}</span>
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-base-muted">
            {releases.length === 0 ? "No releases yet. Add your first one above." : "No releases with this status."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-base-muted text-xs uppercase tracking-wide">
                  <th className="px-4 sm:px-5 py-2.5 font-semibold">Title</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Release date</th>
                  <th className="px-3 py-2.5 font-semibold">Distributor</th>
                  <th className="px-4 sm:px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t border-base-border/60">
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0 max-w-[260px]">
                        <ReleaseCover release={r} />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{r.title}</div>
                          {r.link_url && (
                            <a href={r.link_url} target="_blank" rel="noopener noreferrer" className="block text-xs text-brand-light hover:text-brand truncate">
                              {r.link_url.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-3 py-3 text-base-muted whitespace-nowrap">{formatReleaseDate(r.release_date)}</td>
                    <td className="px-3 py-3 text-base-muted">{r.distributor || "—"}</td>
                    <td className="px-4 sm:px-5 py-3 text-right whitespace-nowrap">
                      {canEdit && (
                        <button type="button" onClick={() => startEdit(r)} className="text-xs font-semibold text-brand-light hover:text-brand mr-4">
                          Edit
                        </button>
                      )}
                      <button type="button" onClick={() => handleDelete(r)} className="text-xs font-semibold text-base-muted hover:text-red-400">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
