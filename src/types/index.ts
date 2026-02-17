export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  favicon?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}

export type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Bookmark;
  old: Bookmark;
};
