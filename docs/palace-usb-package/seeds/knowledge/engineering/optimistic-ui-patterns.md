# Optimistic UI Patterns

## Deep Knowledge Seed — Palace LLM Reference

Complete reference for building optimistic UIs with TanStack Query v5, Next.js 16 Server Actions, and React's useOptimistic hook. Every pattern includes production-ready TypeScript/TSX code with proper rollback handling.

---

## 1. What Is Optimistic UI?

Optimistic UI means updating the interface immediately before the server confirms the change. If the server rejects the change, you roll back to the previous state.

**Why it matters:**
- Users perceive the app as instant (no loading spinners for common actions)
- Critical for engagement features: likes, bookmarks, chat messages, toggles
- Expected in modern apps — lag on a "like" button feels broken

**When to use:**
- High-confidence mutations (>99% success rate)
- Non-destructive actions (likes, bookmarks, message sends)
- Actions where the server rarely disagrees

**When NOT to use:**
- Payments/billing (never optimistic)
- Destructive actions (delete should confirm, not optimistically remove)
- Complex server-side validation (username availability)
- Actions that depend on server-generated data (IDs, timestamps)

---

## 2. TanStack Query v5 — Optimistic Mutations

### Setup

```bash
npm install @tanstack/react-query
```

```tsx
// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Core Pattern: useMutation with Optimistic Update

The flow: `onMutate` (optimistic update) → `mutationFn` (server call) → `onError` (rollback) → `onSettled` (refetch to sync).

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Post {
  id: string;
  title: string;
  content: string;
  likeCount: number;
  isLikedByUser: boolean;
}

function useToggleLike(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json();
    },

    // Step 1: Optimistic update BEFORE server call
    onMutate: async () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      // Snapshot the previous value (for rollback)
      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      // Optimistically update the cache
      queryClient.setQueryData<Post>(["post", postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          isLikedByUser: !old.isLikedByUser,
          likeCount: old.isLikedByUser
            ? old.likeCount - 1
            : old.likeCount + 1,
        };
      });

      // Return context with the snapshotted value
      return { previousPost };
    },

    // Step 2: If mutation fails, roll back to snapshot
    onError: (_error, _variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },

    // Step 3: Always refetch after error or success to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}

// Usage in component
function LikeButton({ post }: { post: Post }) {
  const likeMutation = useToggleLike(post.id);

  return (
    <Button
      variant={post.isLikedByUser ? "default" : "outline"}
      size="sm"
      onClick={() => likeMutation.mutate()}
      disabled={likeMutation.isPending}
    >
      <HeartIcon
        className={cn(
          "mr-1 size-4",
          post.isLikedByUser && "fill-current text-red-500"
        )}
      />
      {post.likeCount}
    </Button>
  );
}
```

---

## 3. Optimistic List Operations

### Add Item to List

```tsx
interface Agent {
  id: string;
  name: string;
  tier: string;
  createdAt: string;
}

function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newAgent: { name: string; tier: string }) => {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgent),
      });
      if (!res.ok) throw new Error("Failed to create agent");
      return res.json() as Promise<Agent>;
    },

    onMutate: async (newAgent) => {
      await queryClient.cancelQueries({ queryKey: ["agents"] });

      const previousAgents = queryClient.getQueryData<Agent[]>(["agents"]);

      // Add a temporary optimistic agent
      const optimisticAgent: Agent = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: newAgent.name,
        tier: newAgent.tier,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Agent[]>(["agents"], (old) =>
        old ? [...old, optimisticAgent] : [optimisticAgent]
      );

      return { previousAgents };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousAgents) {
        queryClient.setQueryData(["agents"], context.previousAgents);
      }
      toast.error("Failed to create agent");
    },

    onSuccess: () => {
      toast.success("Agent created!");
    },

    onSettled: () => {
      // Refetch to replace temp ID with real server ID
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}
```

### Remove Item from List

```tsx
function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete agent");
    },

    onMutate: async (agentId) => {
      await queryClient.cancelQueries({ queryKey: ["agents"] });

      const previousAgents = queryClient.getQueryData<Agent[]>(["agents"]);

      // Optimistically remove from list
      queryClient.setQueryData<Agent[]>(["agents"], (old) =>
        old ? old.filter((a) => a.id !== agentId) : []
      );

      return { previousAgents };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousAgents) {
        queryClient.setQueryData(["agents"], context.previousAgents);
      }
      toast.error("Failed to delete agent");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

// Usage with confirmation
function AgentDeleteButton({ agent }: { agent: Agent }) {
  const deleteMutation = useDeleteAgent();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {agent.name}?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteMutation.mutate(agent.id)}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Reorder Items in List

```tsx
interface SortableItem {
  id: string;
  name: string;
  order: number;
}

function useReorderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOrder: { id: string; order: number }[]) => {
      const res = await fetch("/api/items/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newOrder }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
    },

    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: ["items"] });

      const previousItems = queryClient.getQueryData<SortableItem[]>(["items"]);

      // Apply new order optimistically
      queryClient.setQueryData<SortableItem[]>(["items"], (old) => {
        if (!old) return old;
        const orderMap = new Map(newOrder.map((item) => [item.id, item.order]));
        return [...old]
          .map((item) => ({
            ...item,
            order: orderMap.get(item.id) ?? item.order,
          }))
          .sort((a, b) => a.order - b.order);
      });

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["items"], context.previousItems);
      }
      toast.error("Failed to reorder. Reverted.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

// Usage with drag-and-drop
function SortableList() {
  const { data: items } = useQuery<SortableItem[]>({
    queryKey: ["items"],
    queryFn: fetchItems,
  });
  const reorderMutation = useReorderItems();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !items) return;

    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Calculate new order values
    const newOrder = reordered.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    reorderMutation.mutate(newOrder);
  };

  // ... DnD rendering ...
}
```

---

## 4. Cache Invalidation Strategies

### Targeted Invalidation

```tsx
const queryClient = useQueryClient();

// Invalidate a specific query
queryClient.invalidateQueries({ queryKey: ["post", postId] });

// Invalidate all queries that start with "posts"
queryClient.invalidateQueries({ queryKey: ["posts"] });

// Invalidate everything (nuclear option — rarely needed)
queryClient.invalidateQueries();
```

### Precise Cache Updates (Skip Refetch)

When the mutation response contains the updated data, update the cache directly without refetching:

```tsx
const updateAgentMutation = useMutation({
  mutationFn: async (data: { id: string; name: string }) => {
    const res = await fetch(`/api/agents/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name }),
    });
    return res.json() as Promise<Agent>;
  },

  onSuccess: (updatedAgent) => {
    // Update the individual agent query
    queryClient.setQueryData(["agent", updatedAgent.id], updatedAgent);

    // Update the agent in the list without refetching the list
    queryClient.setQueryData<Agent[]>(["agents"], (old) =>
      old?.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
    );

    // No invalidation needed — we've updated the cache precisely
  },
});
```

### Predicate-Based Invalidation

```tsx
// Invalidate all queries related to a user
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === "user" ||
    (query.queryKey[0] === "posts" && query.queryKey[1] === userId),
});
```

### Stale-While-Revalidate Pattern

```tsx
const { data, isLoading, isFetching } = useQuery({
  queryKey: ["agents"],
  queryFn: fetchAgents,
  staleTime: 30 * 1000, // Data is "fresh" for 30 seconds
  gcTime: 5 * 60 * 1000, // Cache persists for 5 minutes
});

// isLoading: true only on first load (no cached data)
// isFetching: true whenever a fetch is in progress (including background refetch)

// Show stale data immediately, with a subtle refetch indicator
<div className="relative">
  {isFetching && !isLoading && (
    <div className="absolute top-0 right-0">
      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
    </div>
  )}
  <AgentList agents={data ?? []} />
</div>
```

---

## 5. Optimistic Updates with Next.js Server Actions

### useOptimistic Hook (React 19+)

`useOptimistic` is a React hook designed specifically for optimistic updates with Server Actions.

```tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { toggleLikeAction } from "@/app/actions/posts";

interface Post {
  id: string;
  likeCount: number;
  isLikedByUser: boolean;
}

function PostCard({ post }: { post: Post }) {
  const [isPending, startTransition] = useTransition();

  const [optimisticPost, setOptimisticPost] = useOptimistic(
    post,
    // Reducer: takes current state + optimistic value, returns new optimistic state
    (currentPost: Post, optimisticAction: "toggle") => ({
      ...currentPost,
      isLikedByUser: !currentPost.isLikedByUser,
      likeCount: currentPost.isLikedByUser
        ? currentPost.likeCount - 1
        : currentPost.likeCount + 1,
    })
  );

  const handleLike = () => {
    startTransition(async () => {
      // Set optimistic state immediately
      setOptimisticPost("toggle");

      // Server action runs — when it completes, React re-renders with real data
      await toggleLikeAction(post.id);
    });
  };

  return (
    <Card>
      <CardContent>
        <p>{post.title}</p>
      </CardContent>
      <CardFooter>
        <Button
          variant={optimisticPost.isLikedByUser ? "default" : "outline"}
          size="sm"
          onClick={handleLike}
          disabled={isPending}
        >
          <HeartIcon
            className={cn(
              "mr-1 size-4",
              optimisticPost.isLikedByUser && "fill-current text-red-500"
            )}
          />
          {optimisticPost.likeCount}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Server Action

```typescript
// src/app/actions/posts.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleLikeAction(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.like.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existing) {
    await prisma.like.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.like.create({
      data: { userId, postId },
    });
  }

  revalidatePath("/forum");
}
```

### useOptimistic with Lists

```tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { addBookmarkAction, removeBookmarkAction } from "@/app/actions/bookmarks";

interface Bookmark {
  id: string;
  agentId: string;
  agentName: string;
}

type BookmarkAction =
  | { type: "add"; bookmark: Bookmark }
  | { type: "remove"; bookmarkId: string };

function BookmarksList({
  bookmarks,
}: {
  bookmarks: Bookmark[];
}) {
  const [isPending, startTransition] = useTransition();

  const [optimisticBookmarks, dispatch] = useOptimistic(
    bookmarks,
    (state: Bookmark[], action: BookmarkAction) => {
      switch (action.type) {
        case "add":
          return [...state, action.bookmark];
        case "remove":
          return state.filter((b) => b.id !== action.bookmarkId);
        default:
          return state;
      }
    }
  );

  const handleAdd = (agentId: string, agentName: string) => {
    const tempBookmark: Bookmark = {
      id: `temp-${Date.now()}`,
      agentId,
      agentName,
    };

    startTransition(async () => {
      dispatch({ type: "add", bookmark: tempBookmark });
      await addBookmarkAction(agentId);
    });
  };

  const handleRemove = (bookmarkId: string) => {
    startTransition(async () => {
      dispatch({ type: "remove", bookmarkId });
      await removeBookmarkAction(bookmarkId);
    });
  };

  return (
    <div className="space-y-2">
      {optimisticBookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className={cn(
            "flex items-center justify-between rounded-md border p-3",
            bookmark.id.startsWith("temp-") && "opacity-60" // Visual hint for optimistic items
          )}
        >
          <span>{bookmark.agentName}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(bookmark.id)}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
```

---

## 6. Conflict Resolution

### When the Server Disagrees

```tsx
function useToggleLikeWithConflict(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to toggle like");
      }
      return res.json() as Promise<{ likeCount: number; isLiked: boolean }>;
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      const previous = queryClient.getQueryData<Post>(["post", postId]);

      queryClient.setQueryData<Post>(["post", postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          isLikedByUser: !old.isLikedByUser,
          likeCount: old.isLikedByUser ? old.likeCount - 1 : old.likeCount + 1,
        };
      });

      return { previous };
    },

    onError: (error, _variables, context) => {
      // Roll back optimistic update
      if (context?.previous) {
        queryClient.setQueryData(["post", postId], context.previous);
      }

      // Show appropriate error
      if (error.message.includes("rate limit")) {
        toast.error("Too many likes. Slow down!");
      } else if (error.message.includes("not found")) {
        toast.error("This post has been deleted.");
        // Remove from list cache
        queryClient.setQueryData<Post[]>(["posts"], (old) =>
          old?.filter((p) => p.id !== postId)
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    },

    onSuccess: (serverData) => {
      // Server response is authoritative — use it to correct any drift
      queryClient.setQueryData<Post>(["post", postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          likeCount: serverData.likeCount, // Server's count wins
          isLikedByUser: serverData.isLiked, // Server's state wins
        };
      });
    },

    onSettled: () => {
      // Don't invalidate — we already set the authoritative data in onSuccess
      // Only invalidate if onSuccess didn't fire (i.e., error path)
    },
  });
}
```

### Retry with Exponential Backoff

```tsx
const mutation = useMutation({
  mutationFn: submitData,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  // Attempt 0: 1s, Attempt 1: 2s, Attempt 2: 4s
});
```

### Versioned Updates (Prevent Stale Writes)

```tsx
// Server returns a version number with each response
interface VersionedPost {
  id: string;
  content: string;
  version: number; // Increments on each update
}

function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; content: string; version: number }) => {
      const res = await fetch(`/api/posts/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.content,
          expectedVersion: data.version, // Server checks this
        }),
      });

      if (res.status === 409) {
        // Version conflict — someone else edited this post
        const serverPost = await res.json();
        throw new ConflictError("Post was edited by someone else", serverPost);
      }

      if (!res.ok) throw new Error("Failed to update");
      return res.json() as Promise<VersionedPost>;
    },

    onError: (error) => {
      if (error instanceof ConflictError) {
        // Show conflict resolution UI
        toast.error("This post was edited by someone else.", {
          action: {
            label: "Reload",
            onClick: () => {
              queryClient.invalidateQueries({ queryKey: ["post", error.serverData.id] });
            },
          },
          duration: 10000,
        });
      }
    },
  });
}

class ConflictError extends Error {
  constructor(message: string, public serverData: VersionedPost) {
    super(message);
  }
}
```

---

## 7. Loading States and Progressive Enhancement

### Skeleton Screens

```tsx
function PostCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-3 w-[80px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[85%] mt-2" />
        <Skeleton className="h-4 w-[60%] mt-2" />
      </CardContent>
      <CardFooter className="flex gap-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  );
}

function PostFeed() {
  const { data: posts, isLoading, isFetching } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### Inline Loading States

```tsx
function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending}>
      {isPending ? (
        <>
          <Loader2Icon className="mr-2 size-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save Changes"
      )}
    </Button>
  );
}
```

### Optimistic with Visual Pending State

```tsx
function ChatMessage({
  message,
}: {
  message: {
    id: string;
    content: string;
    status: "sending" | "sent" | "error";
  };
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 max-w-[80%]",
        message.status === "sending" && "opacity-60",
        message.status === "error" && "border border-destructive"
      )}
    >
      <p className="text-sm">{message.content}</p>
      <div className="flex items-center gap-1 mt-1">
        {message.status === "sending" && (
          <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
        )}
        {message.status === "sent" && (
          <CheckCheckIcon className="size-3 text-muted-foreground" />
        )}
        {message.status === "error" && (
          <button className="text-xs text-destructive hover:underline">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 8. Real-World Examples

### Chat Messages (Optimistic Send)

```tsx
"use client";

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  status?: "sending" | "sent" | "error";
}

function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json() as Promise<ChatMessage>;
    },

    onMutate: async (content) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>([
        "messages",
        conversationId,
      ]);

      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content,
        userId: "current-user",
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      queryClient.setQueryData<ChatMessage[]>(
        ["messages", conversationId],
        (old) => (old ? [...old, optimisticMessage] : [optimisticMessage])
      );

      return { previousMessages, optimisticId: optimisticMessage.id };
    },

    onSuccess: (serverMessage, _content, context) => {
      // Replace temp message with real server message
      queryClient.setQueryData<ChatMessage[]>(
        ["messages", conversationId],
        (old) =>
          old?.map((msg) =>
            msg.id === context?.optimisticId
              ? { ...serverMessage, status: "sent" as const }
              : msg
          )
      );
    },

    onError: (_error, _content, context) => {
      // Mark the optimistic message as failed (don't remove — let user retry)
      queryClient.setQueryData<ChatMessage[]>(
        ["messages", conversationId],
        (old) =>
          old?.map((msg) =>
            msg.id === context?.optimisticId
              ? { ...msg, status: "error" as const }
              : msg
          )
      );
    },
  });
}

// Chat input component
function ChatInput({ conversationId }: { conversationId: string }) {
  const [message, setMessage] = useState("");
  const sendMutation = useSendMessage(conversationId);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
    setMessage(""); // Clear input immediately (optimistic)
  };

  return (
    <div className="flex gap-2 p-4 border-t">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <Button onClick={handleSend} disabled={!message.trim()}>
        <SendIcon className="size-4" />
      </Button>
    </div>
  );
}
```

### Bookmark Toggle

```tsx
function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      isBookmarked,
    }: {
      agentId: string;
      isBookmarked: boolean;
    }) => {
      const method = isBookmarked ? "DELETE" : "POST";
      const res = await fetch(`/api/agents/${agentId}/bookmark`, { method });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },

    onMutate: async ({ agentId, isBookmarked }) => {
      // Update in multiple cache locations
      await queryClient.cancelQueries({ queryKey: ["agent", agentId] });
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

      const previousAgent = queryClient.getQueryData(["agent", agentId]);
      const previousBookmarks = queryClient.getQueryData(["bookmarks"]);

      // Update agent detail
      queryClient.setQueryData<Agent>(["agent", agentId], (old) =>
        old ? { ...old, isBookmarked: !isBookmarked } : old
      );

      // Update bookmarks list
      if (isBookmarked) {
        queryClient.setQueryData<Agent[]>(["bookmarks"], (old) =>
          old?.filter((a) => a.id !== agentId)
        );
      }

      return { previousAgent, previousBookmarks };
    },

    onError: (_error, { agentId }, context) => {
      if (context?.previousAgent) {
        queryClient.setQueryData(["agent", agentId], context.previousAgent);
      }
      if (context?.previousBookmarks) {
        queryClient.setQueryData(["bookmarks"], context.previousBookmarks);
      }
      toast.error("Failed to update bookmark");
    },

    onSettled: (_data, _error, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

// Usage
function BookmarkButton({ agent }: { agent: Agent }) {
  const toggle = useToggleBookmark();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() =>
        toggle.mutate({
          agentId: agent.id,
          isBookmarked: agent.isBookmarked,
        })
      }
    >
      <BookmarkIcon
        className={cn(
          "size-5",
          agent.isBookmarked
            ? "fill-primary text-primary"
            : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
```

### Drag-and-Drop Reorder

```tsx
"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FavoriteAgent {
  id: string;
  name: string;
  order: number;
}

function useReorderFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await fetch("/api/favorites/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
    },

    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const previous = queryClient.getQueryData<FavoriteAgent[]>(["favorites"]);

      // Apply new order optimistically
      queryClient.setQueryData<FavoriteAgent[]>(["favorites"], (old) => {
        if (!old) return old;
        const map = new Map(old.map((item) => [item.id, item]));
        return orderedIds
          .map((id, index) => {
            const item = map.get(id);
            return item ? { ...item, order: index } : null;
          })
          .filter(Boolean) as FavoriteAgent[];
      });

      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["favorites"], context.previous);
      }
      toast.error("Failed to reorder. Changes reverted.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

function SortableItem({ agent }: { agent: FavoriteAgent }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: agent.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card p-3",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4 text-muted-foreground" />
      </button>
      <span className="font-medium">{agent.name}</span>
    </div>
  );
}

function FavoritesList() {
  const { data: favorites } = useQuery<FavoriteAgent[]>({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  const reorderMutation = useReorderFavorites();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !favorites) return;

    const oldIndex = favorites.findIndex((f) => f.id === active.id);
    const newIndex = favorites.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(favorites, oldIndex, newIndex);

    reorderMutation.mutate(reordered.map((f) => f.id));
  };

  if (!favorites) return <div>Loading...</div>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={favorites.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {favorites.map((agent) => (
            <SortableItem key={agent.id} agent={agent} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

---

## 9. Mutation Deduplication and Queuing

### Prevent Duplicate Mutations

```tsx
function LikeButton({ postId }: { postId: string }) {
  const mutation = useToggleLike(postId);

  return (
    <Button
      onClick={() => {
        // Don't fire again if one is already in flight
        if (!mutation.isPending) {
          mutation.mutate();
        }
      }}
      disabled={mutation.isPending}
    >
      Like
    </Button>
  );
}
```

### Sequential Mutation Queue

For operations that must happen in order:

```tsx
import { useMutationState } from "@tanstack/react-query";

function useSendMessageQueued(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },

    // Wait for previous mutations with same key to finish
    scope: {
      id: `send-message-${conversationId}`,
    },

    onMutate: async (content) => {
      // ... optimistic update ...
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}
```

---

## 10. Pattern Decision Table

| Scenario | Pattern | Key Hook |
|---|---|---|
| Toggle (like, bookmark) | Optimistic flip + rollback | `useMutation` with `onMutate` |
| Add to list | Optimistic append with temp ID | `useMutation` + `setQueryData` |
| Remove from list | Optimistic filter | `useMutation` + `setQueryData` |
| Reorder list | Optimistic `arrayMove` | `useMutation` + DnD library |
| Send message | Optimistic append + status tracking | `useMutation` + scope |
| Form submit | Loading state, NOT optimistic | `useMutation.isPending` |
| Server Action toggle | `useOptimistic` + `startTransition` | `useOptimistic` |
| Server Action list | `useOptimistic` with reducer | `useOptimistic` + dispatch |
| Refetch on focus | Stale-while-revalidate | `staleTime` + `refetchOnWindowFocus` |
| Precise cache update | `onSuccess` with server data | `setQueryData` in `onSuccess` |

---

## 11. Testing Optimistic UI

### Key Things to Test

1. **Optimistic state appears immediately** (no loading delay)
2. **Rollback works on error** (revert to previous state)
3. **Cache syncs with server** after settled
4. **Duplicate clicks are handled** (disabled during pending)
5. **Error feedback shows** (toast, inline message)

### Mock Pattern

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithClient(ui: React.ReactElement) {
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

test("like button toggles optimistically", async () => {
  // Mock successful like
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ likeCount: 6, isLiked: true }),
  });

  const post = { id: "1", likeCount: 5, isLikedByUser: false };
  renderWithClient(<LikeButton post={post} />);

  // Click like
  await userEvent.click(screen.getByRole("button"));

  // Should show 6 immediately (optimistic)
  expect(screen.getByText("6")).toBeInTheDocument();
});

test("like button rolls back on error", async () => {
  // Mock failed like
  global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

  const post = { id: "1", likeCount: 5, isLikedByUser: false };
  renderWithClient(<LikeButton post={post} />);

  await userEvent.click(screen.getByRole("button"));

  // Briefly shows 6, then reverts
  await waitFor(() => {
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
```

This covers every optimistic UI pattern needed for Stone AI production development. The key principle: update immediately, snapshot for rollback, sync with server after settlement.
