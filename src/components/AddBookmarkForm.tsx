"use client";

import { useState } from "react";

interface AddBookmarkFormProps {
  onAdd: (url: string, title: string) => Promise<boolean>;
}

function isValidUrl(str: string) {
  try {
    const url = new URL(str.startsWith("http") ? str : `https://${str}`);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

function normalizeUrl(str: string) {
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  return `https://${str}`;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function generateTitle(url: string) {
  const domain = getDomain(url);
  // Capitalize domain nicely as fallback title
  return domain
    .split(".")[0]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AddBookmarkForm({ onAdd }: AddBookmarkFormProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [showTitleField, setShowTitleField] = useState(false);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setUrlError("");
    // Auto-populate title as placeholder when URL is valid
    if (val.length > 5 && isValidUrl(val)) {
      if (!title) {
        setTitle(generateTitle(normalizeUrl(val)));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setUrlError("URL is required");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setUrlError("Please enter a valid URL");
      return;
    }

    const finalUrl = normalizeUrl(trimmedUrl);
    const finalTitle = title.trim() || generateTitle(finalUrl);

    setLoading(true);
    const success = await onAdd(finalUrl, finalTitle);
    setLoading(false);

    if (success) {
      setUrl("");
      setTitle("");
      setShowTitleField(false);
    }
  };

  return (
    <div
      className="glass-strong rounded-2xl p-5 mb-6"
      style={{ border: "1px solid rgba(108,99,255,0.2)" }}
    >
      <h3
        className="font-display font-semibold text-sm text-mist mb-4 uppercase tracking-widest"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Add Bookmark
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ghost pointer-events-none">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Paste a URL..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={`input-dark pl-11 ${
                  urlError ? "border-coral" : ""
                }`}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {urlError && (
              <p className="text-coral text-xs mt-1.5 font-mono">{urlError}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowTitleField(!showTitleField)}
            className="btn-ghost text-sm whitespace-nowrap sm:w-auto"
            title="Add custom title"
          >
            {showTitleField ? "Hide title" : "Add title"}
          </button>

          <button
            type="submit"
            disabled={loading || !url}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Title field */}
        {showTitleField && (
          <div className="mt-3">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ghost pointer-events-none">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a0 0 011-1z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Custom title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-dark pl-11"
                maxLength={120}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
