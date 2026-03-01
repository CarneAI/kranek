import { useState } from 'react';
import { Layout } from './components/Layout';
import { ChatInterface } from './components/ChatInterface';
import { CodePreview } from './components/CodePreview';
import { useUsageLimit } from './hooks/use-usage-limit';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'chat' | 'code'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  
  const { usage, incrementUsage } = useUsageLimit();

  const handleCodeGenerated = (code: string) => {
    setGeneratedCode(code);
  };

  const handleNewChat = () => {
    setMessages([]);
    setGeneratedCode('');
    setActiveView('chat');
  };

  return (
    <Layout
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      activeView={activeView}
      setActiveView={setActiveView}
      onNewChat={handleNewChat}
    >
      {activeView === 'chat' ? (
        <ChatInterface
          messages={messages}
          setMessages={setMessages}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          onCodeGenerated={handleCodeGenerated}
          usage={usage}
          incrementUsage={incrementUsage}
        />
      ) : (
        <CodePreview code={generatedCode} />
      )}
    </Layout>
  );
}
