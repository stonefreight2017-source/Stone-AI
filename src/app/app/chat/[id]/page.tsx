import { ChatViewWrapper } from "./chat-view-wrapper";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  return <ChatViewWrapper conversationId={id} />;
}
