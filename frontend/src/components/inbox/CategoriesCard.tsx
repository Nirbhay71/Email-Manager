import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../../utils/api.ts";

interface Category { id: string; name: string; createdAt: string }

export default function CategoriesCard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await apiFetch("/categories", { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setCategories((await res.json()).categories ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Unable to load categories.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/categories", { method: "POST", body: JSON.stringify({ name: value }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not add category");
      setCategories((prev) => [json.category, ...prev]);
      setName("");
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-[32px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] p-[24px] flex flex-col min-h-[280px] max-h-[420px]">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black leading-[28px]">Categories</h2>
        <button
          onClick={() => { setAdding(!adding); setError(""); }}
          aria-label={adding ? "Cancel" : "Add category"}
          className="w-[32px] h-[32px] rounded-full bg-black text-white text-[18px] leading-none flex items-center justify-center hover:opacity-80 transition"
          type="button"
        >
          {adding ? "×" : "+"}
        </button>
      </div>

      {adding && (
        <form onSubmit={create} className="flex gap-[8px] mt-[12px] shrink-0">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            maxLength={40}
            className="flex-1 min-w-0 bg-[#f9fafb] border border-[#e5e7eb] rounded-full px-[14px] py-[8px] text-[13px] outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="bg-black text-white rounded-full px-[16px] text-[13px] font-semibold disabled:opacity-40"
          >
            {saving ? "…" : "Add"}
          </button>
        </form>
      )}

      {error && <p role="alert" className="text-[12px] text-[#dc2626] mt-[8px] shrink-0">{error}</p>}

      <div className="flex-1 min-h-0 overflow-y-auto mt-[12px] -mr-[6px] pr-[6px]">
        {loading ? (
          <div aria-busy className="flex flex-col gap-[8px] animate-pulse">
            {[0, 1, 2].map((i) => <div key={i} className="h-[44px] rounded-[16px] bg-[#f3f4f6]" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center gap-[4px]">
            <p className="font-bold text-[14px] text-black">No categories yet</p>
            <p className="text-[12px] text-[#9ca3af]">Use + to create your first one.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-[8px]">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between bg-[#f9fafb] border border-[#f3f4f6] rounded-[16px] px-[16px] py-[12px]">
                <span className="font-semibold text-[14px] text-[#374151] truncate">{c.name}</span>
                <time className="text-[11px] text-[#9ca3af] shrink-0 ml-[12px]" dateTime={c.createdAt}>
                  {new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
