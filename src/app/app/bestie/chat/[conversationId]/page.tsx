import { BestieChatWrapper } from "./bestie-chat-wrapper";

interface BestieChatPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function BestieChatPage({ params }: BestieChatPageProps) {
  const { conversationId } = await params;
  return <BestieChatWrapper conversationId={conversationId} />;
}
