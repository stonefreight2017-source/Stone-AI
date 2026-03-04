"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Plus,
  ArrowLeft,
  Send,
  Pin,
  Lock,
  Filter,
  Loader2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/billing/TierBadge";

interface Author {
  id: string;
  name: string;
  tier: string;
}

interface PostSummary {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  locked: boolean;
  likes: number;
  replyCount: number;
  author: Author;
  createdAt: string;
}

interface Reply {
  id: string;
  content: string;
  likes: number;
  author: Author;
  createdAt: string;
}

interface PostDetail extends PostSummary {
  likedByUserIds: string[];
  replies: Reply[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const CATEGORIES = [
  { key: "ALL", label: "All Posts", color: "bg-zinc-700" },
  { key: "GENERAL", label: "General", color: "bg-blue-900" },
  { key: "TIPS", label: "Tips & Tricks", color: "bg-green-900" },
  { key: "SHOWCASE", label: "Showcase", color: "bg-purple-900" },
  { key: "AGENTS", label: "AI Agents", color: "bg-amber-900" },
  { key: "BUSINESS", label: "Business", color: "bg-indigo-900" },
  { key: "TECHNICAL", label: "Technical", color: "bg-red-900" },
  { key: "FEEDBACK", label: "Feedback", color: "bg-emerald-900" },
];

interface CommunityClientProps {
  userId: string;
  userName: string;
  userTier: string;
}

export function CommunityClient({ userId, userName, userTier }: CommunityClientProps) {
  const [view, setView] = useState<"list" | "detail" | "create">("list");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("newest");

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("GENERAL");
  const [creating, setCreating] = useState(false);

  // Reply form
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);

  const loadPosts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        category,
        sort,
        limit: "20",
      });
      const res = await fetch(`/api/forum?${params}`);
      const data = await res.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [category, sort]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function loadPost(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/${id}`);
      const data = await res.json();
      setSelectedPost(data.post);
      setView("detail");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost() {
    if (!newTitle.trim() || !newContent.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewContent("");
        setNewCategory("GENERAL");
        setView("list");
        loadPosts();
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  }

  async function handleReply() {
    if (!replyContent.trim() || !selectedPost) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/forum/${selectedPost.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPost({
          ...selectedPost,
          replies: [...selectedPost.replies, data.reply],
        });
        setReplyContent("");
      }
    } catch {
      // silent
    } finally {
      setReplying(false);
    }
  }

  async function handleLike(postId: string) {
    try {
      const res = await fetch(`/api/forum/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Update in list
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likes: p.likes + (data.liked ? 1 : -1) }
              : p
          )
        );
        // Update in detail
        if (selectedPost?.id === postId) {
          setSelectedPost({
            ...selectedPost,
            likes: selectedPost.likes + (data.liked ? 1 : -1),
            likedByUserIds: data.liked
              ? [...selectedPost.likedByUserIds, userId]
              : selectedPost.likedByUserIds.filter((id) => id !== userId),
          });
        }
      }
    } catch {
      // silent
    }
  }

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  function getCategoryBadge(cat: string) {
    const found = CATEGORIES.find((c) => c.key === cat);
    return (
      <Badge className={`${found?.color || "bg-zinc-700"} text-white text-[10px] border-0`}>
        {found?.label || cat}
      </Badge>
    );
  }

  // --- CREATE VIEW ---
  if (view === "create") {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white gap-2"
          onClick={() => setView("list")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Community
        </Button>

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Start a Discussion</h1>
          <p className="text-zinc-400 text-sm">
            Share tips, ask questions, or showcase what you've built with Stone AI.
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => c.key !== "ALL").map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setNewCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      newCategory === cat.key
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={200}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Content</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share your thoughts, tips, or questions..."
                rows={8}
                maxLength={10000}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-zinc-600 mt-1">{newContent.length}/10,000</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreatePost}
                disabled={creating || !newTitle.trim() || newContent.trim().length < 10}
                className="bg-blue-600 hover:bg-blue-500"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Post Discussion
              </Button>
              <Button variant="ghost" onClick={() => setView("list")} className="text-zinc-400">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (view === "detail" && selectedPost) {
    const hasLiked = selectedPost.likedByUserIds.includes(userId);
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white gap-2"
          onClick={() => { setView("list"); setSelectedPost(null); }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Community
        </Button>

        {/* Post */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryBadge(selectedPost.category)}
                  {selectedPost.pinned && (
                    <Badge className="bg-amber-900 text-amber-300 text-[10px] border-0">
                      <Pin className="h-3 w-3 mr-1" /> Pinned
                    </Badge>
                  )}
                  {selectedPost.locked && (
                    <Badge className="bg-red-900 text-red-300 text-[10px] border-0">
                      <Lock className="h-3 w-3 mr-1" /> Locked
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl font-bold text-white">{selectedPost.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-white">
                  {selectedPost.author.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-zinc-300 font-medium">{selectedPost.author.name}</span>
                <TierBadge tier={selectedPost.author.tier} />
              </div>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(selectedPost.createdAt)}
              </span>
            </div>

            <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">
              {selectedPost.content}
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
              <button
                onClick={() => handleLike(selectedPost.id)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  hasLiked ? "text-blue-400" : "text-zinc-500 hover:text-blue-400"
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-blue-400" : ""}`} />
                {selectedPost.likes}
              </button>
              <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                <MessageSquare className="h-4 w-4" />
                {selectedPost.replies.length} replies
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400">
            Replies ({selectedPost.replies.length})
          </h2>

          {selectedPost.replies.map((reply) => (
            <Card key={reply.id} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-medium text-white">
                    {reply.author.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-zinc-300 font-medium text-sm">{reply.author.name}</span>
                  <TierBadge tier={reply.author.tier} />
                  <span className="text-zinc-600 text-xs">{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed pl-8">
                  {reply.content}
                </p>
              </CardContent>
            </Card>
          ))}

          {/* Reply form */}
          {!selectedPost.locked ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4 pb-3">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-white shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      rows={3}
                      maxLength={5000}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleReply}
                        disabled={replying || !replyContent.trim()}
                        className="bg-blue-600 hover:bg-blue-500"
                      >
                        {replying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-4 text-zinc-500 text-sm">
              <Lock className="h-4 w-4 inline mr-1" />
              This discussion is locked.
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-400" />
            Community
          </h1>
          <p className="text-zinc-400 text-sm">
            Connect with other Stone AI users. Share tips, ask questions, and learn from each other.
          </p>
        </div>
        <Button onClick={() => setView("create")} className="bg-blue-600 hover:bg-blue-500 gap-2">
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat.key
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[
            { key: "newest", label: "Newest", icon: Clock },
            { key: "popular", label: "Popular", icon: TrendingUp },
            { key: "pinned", label: "Pinned", icon: Pin },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sort === s.key
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">No posts yet</h3>
            <p className="text-zinc-500 text-sm mb-6">
              Be the first to start a discussion in the community!
            </p>
            <Button onClick={() => setView("create")} className="bg-blue-600 hover:bg-blue-500">
              <Plus className="h-4 w-4 mr-2" /> Create First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
              onClick={() => loadPost(post.id)}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getCategoryBadge(post.category)}
                      {post.pinned && <Pin className="h-3 w-3 text-amber-400" />}
                      {post.locked && <Lock className="h-3 w-3 text-red-400" />}
                    </div>
                    <h3 className="font-semibold text-white truncate">{post.title}</h3>
                    <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-zinc-700 flex items-center justify-center text-[8px] font-medium">
                          {post.author.name.charAt(0).toUpperCase()}
                        </div>
                        {post.author.name}
                      </span>
                      <span>{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-zinc-500 text-sm">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {post.likes}
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500 text-sm">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.replyCount}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => loadPosts(i + 1)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
