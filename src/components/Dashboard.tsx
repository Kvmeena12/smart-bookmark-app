"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Bookmark } from "@/types";
import BookmarkCard from "./BookmarkCard";
import AddBookmarkForm from "./AddBookmarkForm";
import UserMenu from "./UserMenu";

interface DashboardProps {
  user: User;
  initialBookmarks: Bookmark[];
}

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  icon: string;
};

export default function Dashboard({ user, initialBookmarks }: DashboardProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [toast, setToast] = useState<Toast | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newBookmarkIds, setNewBookmarkIds] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const toastTimeoutRef = useRef<NodeJS.Timeout>();

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "success", icon = "✓") => {
      const id = Date.now().toString();
      setToast({ id, message, type, icon });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
    },
    []
  );

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`bookmarks:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newBookmark = payload.new as Bookmark;
          setBookmarks((prev) => {
            // Avoid duplicates (optimistic update already added it)
            if (prev.find((b) => b.id === newBookmark.id)) return prev;
            return [newBookmark, ...prev];
          });
          setNewBookmarkIds((prev) => new Set(prev).add(newBookmark.id));
          setTimeout(() => {
            setNewBookmarkIds((prev) => {
              const next = new Set(prev);
              next.delete(newBookmark.id);
              return next;
            });
          }, 1800);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deleted = payload.old as Bookmark;
          setBookmarks((prev) => prev.filter((b) => b.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase]);

  const addBookmark = async (url: string, title: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Bookmark = {
      id: tempId,
      user_id: user.id,
      url,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setBookmarks((prev) => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ user_id: user.id, url, title })
      .select()
      .single();

    if (error) {
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
      showToast("Failed to add bookmark", "error", "✕");
      return false;
    }

    // Replace optimistic with real
    setBookmarks((prev) =>
      prev.map((b) => (b.id === tempId ? data : b))
    );

    // Flash animation on new card
    setNewBookmarkIds((prev) => new Set(prev).add(data.id));
    setTimeout(() => {
      setNewBookmarkIds((prev) => {
        const next = new Set(prev);
        next.delete(data.id);
        return next;
      });
    }, 1800);

    showToast("Bookmark saved!", "success", "🔖");
    return true;
  };

  const deleteBookmark = async (id: string) => {
    // Optimistic remove
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      showToast("Failed to delete bookmark", "error", "✕");
      // Restore on error — refetch
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setBookmarks(data);
      return;
    }

    showToast("Bookmark removed", "info", "🗑");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-void bg-grid">
      {/* Background orbs */}
      <div
        className="orb w-[500px] h-[500px] -top-32 -right-32 opacity-10"
        style={{
          background: "radial-gradient(circle, #6c63ff 0%, transparent 70%)",
        }}
      />
      <div
        className="orb w-[300px] h-[300px] bottom-0 left-0 opacity-8"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg glow-accent-sm"
              style={{
                background: "linear-gradient(135deg, #4a44cc 0%, #6c63ff 100%)",
              }}
            >
              🔖
            </div>
            <span
              className="font-display font-bold text-lg gradient-text"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              SmartMark
            </span>
          </div>

          {/* Center: Realtime status */}
          <div className="hidden sm:flex items-center gap-2 glass rounded-full px-3 py-1.5">
            <div className="realtime-dot" />
            <span className="text-xs font-mono text-mist">Live sync</span>
          </div>

          {/* Right: User */}
          <UserMenu
            userName={userName}
            avatarUrl={avatarUrl}
            email={user.email}
            onSignOut={handleSignOut}
          />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome + stats */}
        <div className="mb-8">
          <h2
            className="font-display font-bold text-3xl text-snow mb-1"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Good to see you,{" "}
            <span className="gradient-text">{userName.split(" ")[0]}</span>
          </h2>
          <p className="text-ghost font-body">
            You have{" "}
            <span className="text-accent-bright font-semibold">
              {bookmarks.length}
            </span>{" "}
            bookmark{bookmarks.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        {/* Add Bookmark Form */}
        <AddBookmarkForm onAdd={addBookmark} />

        {/* Search */}
        {bookmarks.length > 0 && (
          <div className="relative mb-6">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-dark pl-11"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ghost hover:text-snow transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Bookmarks Grid */}
        {filteredBookmarks.length === 0 && bookmarks.length === 0 ? (
          <EmptyState />
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-ghost font-body">
              No bookmarks match &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredBookmarks.map((bookmark, i) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={deleteBookmark}
                isNew={newBookmarkIds.has(bookmark.id)}
                animationDelay={i * 50}
              />
            ))}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`toast ${
            toast.type === "error"
              ? "border border-red-500/20"
              : toast.type === "info"
              ? "border border-ghost/20"
              : "border border-jade/20"
          }`}
        >
          <span className="text-xl">{toast.icon}</span>
          <div>
            <p className="text-sm font-body text-snow">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-ghost hover:text-snow transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(108,99,255,0.2) 0%, rgba(139,133,255,0.1) 100%)",
          border: "1px solid rgba(108,99,255,0.2)",
        }}
      >
        🔖
      </div>
      <h3
        className="font-display font-bold text-2xl text-snow mb-2"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        No bookmarks yet
      </h3>
      <p className="text-ghost font-body max-w-xs mx-auto">
        Add your first bookmark above. It will sync instantly across all your
        open tabs.
      </p>
    </div>
  );
}
