"use client";

import { useState } from "react";
import type { Bookmark } from "@/types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  isNew?: boolean;
  animationDelay?: number;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

function getInitials(title: string) {
  return title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function BookmarkCard({
  bookmark,
  onDelete,
  isNew = false,
  animationDelay = 0,
}: BookmarkCardProps) {
  const [faviconError, setFaviconError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const domain = getDomain(bookmark.url);
  const faviconUrl = getFaviconUrl(bookmark.url);
  const initials = getInitials(bookmark.title || domain);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    await onDelete(bookmark.id);
  };

  return (
    <div
      className={`bookmark-card stagger-item group ${
        isNew ? "new-bookmark-flash" : ""
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-2xl"
        style={{
          background: "linear-gradient(180deg, #6c63ff 0%, #8b5cf6 100%)",
        }}
      />

      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-4 block"
        style={{ textDecoration: "none" }}
      >
        {/* Favicon */}
        <div className="flex-shrink-0">
          {!faviconError && faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              width={32}
              height={32}
              className="rounded-lg"
              onError={() => setFaviconError(true)}
              style={{ width: 32, height: 32, objectFit: "cover" }}
            />
          ) : (
            <div className="favicon-placeholder text-sm">
              {initials || "🔗"}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-body font-medium text-snow text-sm truncate group-hover:text-accent-bright transition-colors duration-200">
            {bookmark.title || domain}
          </p>
          <p className="font-mono text-xs text-ghost truncate mt-0.5">
            {domain}
          </p>
        </div>

        {/* Meta & actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Timestamp */}
          <span className="hidden sm:block text-xs font-mono text-ghost whitespace-nowrap">
            {formatDate(bookmark.created_at)}
          </span>

          {/* External link icon */}
          <div className="text-ghost group-hover:text-mist transition-colors duration-200">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="delete-btn p-1.5 rounded-lg text-ghost hover:text-coral hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
            title="Delete bookmark"
            aria-label="Delete bookmark"
          >
            {deleting ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
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
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        </div>
      </a>
    </div>
  );
}
