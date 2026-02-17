"use client";

import { useState, useRef, useEffect } from "react";

interface UserMenuProps {
  userName: string;
  avatarUrl?: string;
  email?: string;
  onSignOut: () => void;
}

export default function UserMenu({
  userName,
  avatarUrl,
  email,
  onSignOut,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 glass rounded-xl px-3 py-2 hover:border-accent/40 transition-all duration-200"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Avatar */}
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={userName}
            width={28}
            height={28}
            className="rounded-lg object-cover"
            onError={() => setImgError(true)}
            style={{ width: 28, height: 28 }}
          />
        ) : (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #4a44cc 0%, #6c63ff 100%)",
            }}
          >
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-sm font-body text-snow max-w-[120px] truncate">
          {userName.split(" ")[0]}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-ghost transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-2xl overflow-hidden z-50"
          style={{ border: "1px solid var(--border)", minWidth: 200 }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-snow font-body truncate">
              {userName}
            </p>
            {email && (
              <p className="text-xs text-ghost font-mono truncate mt-0.5">
                {email}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-body text-ghost hover:text-coral hover:bg-red-500/10 transition-all duration-200"
            >
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
