import { MessageSquare } from "lucide-react";

export default function AppPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
      <MessageSquare className="h-12 w-12" />
      <h2 className="text-xl font-medium text-zinc-300">Stone AI</h2>
      <p className="text-sm">Start a new chat or select a conversation</p>
    </div>
  );
}
