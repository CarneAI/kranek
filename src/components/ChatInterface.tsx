import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, AlertCircle, Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  onCodeGenerated: (code: string) => void;
  usage: { count: number; blockedUntil: string | null };
  incrementUsage: () => boolean;
}

const MODELS = [
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', icon: Sparkles, color: 'text-blue-400' },
  { id: 'gpt-4.5-beta', name: 'GPT 4.5 BETA', icon: Zap, color: 'text-green-400' },
  { id: 'claude-3.5-beta', name: 'Claude 3.5 BETA', icon: Brain, color: 'text-orange-400' },
];

export function ChatInterface({ 
  messages, 
  setMessages, 
  isGenerating, 
  setIsGenerating, 
  onCodeGenerated,
  usage,
  incrementUsage
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    if (usage.blockedUntil) {
        // Blocked logic handled by parent or UI feedback
        return;
    }

    if (!incrementUsage()) {
        // Failed to increment (blocked)
        return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    // Add placeholder assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isThinking: true
    }]);

    try {
      // Construct prompt for code generation
      const prompt = `
        You are an expert full-stack web developer. 
        Create a complete, functional web application based on this request: "${userMessage.content}".
        
        IMPORTANT:
        1. Provide the code in separate markdown code blocks.
        2. Label each block with the filename (e.g., \`html index.html\`, \`css style.css\`, \`js script.js\`).
        3. Ensure the HTML file links to the CSS and JS files correctly.
        4. Use modern, clean, and responsive design (Tailwind CSS is preferred if applicable, or standard CSS).
        5. Write the full code, do not use placeholders.
        6. If images are needed, use placeholder images from unsplash or picsum.
        
        Start by briefly explaining your plan, then provide the code.
      `;

      // Use Gemini for all models (simulation)
      const modelId = 'gemini-2.5-flash-latest'; // Mapping all to available model
      
      const response = await ai.models.generateContentStream({
        model: modelId,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      let fullContent = '';
      
      for await (const chunk of response) {
        const text = chunk.text || '';
        fullContent += text;
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullContent, isThinking: false }
            : msg
        ));
        
        // Stream code to parent for preview
        onCodeGenerated(fullContent);
      }

    } catch (error) {
      console.error("Error generating content:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: "Sorry, I encountered an error while generating the code.", isThinking: false }
          : msg
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <Bot size={48} className="text-zinc-400" />
            <h2 className="text-xl font-semibold">What would you like to build today?</h2>
            <p className="text-sm text-zinc-500 max-w-md">
              I can generate full-stack web applications, landing pages, and interactive components.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 p-4 rounded-xl max-w-[85%]",
              msg.role === 'user' 
                ? "ml-auto bg-zinc-800 text-white" 
                : "bg-zinc-900/50 border border-zinc-800 text-zinc-200"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-blue-600" : "bg-purple-600"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="prose prose-invert prose-sm max-w-none">
                {/* Simple rendering for now, could use react-markdown */}
                <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 m-0 border-0">
                  {msg.content}
                </pre>
              </div>
              {msg.isThinking && (
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500 animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  Thinking...
                </div>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur">
        {usage.blockedUntil ? (
             <div className="flex items-center justify-center gap-2 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 mb-4">
                <AlertCircle size={16} />
                <span>Daily limit reached. Try again later.</span>
             </div>
        ) : (
            <div className="flex flex-col gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-lg">
            {/* Model Selector */}
            <div className="flex gap-2 px-2 py-1 border-b border-zinc-800/50">
                {MODELS.map((model) => (
                <button
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                    selectedModel.id === model.id 
                        ? "bg-zinc-800 text-white" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    <model.icon size={12} className={model.color} />
                    {model.name}
                </button>
                ))}
            </div>

            <div className="flex items-end gap-2">
                <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                    }
                }}
                placeholder="Describe the website you want to build..."
                className="flex-1 bg-transparent border-0 focus:ring-0 resize-none min-h-[60px] max-h-[200px] py-2 px-3 text-sm"
                disabled={isGenerating}
                />
                <button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors mb-1 mr-1"
                >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </div>
            </div>
        )}
        <div className="text-center mt-2 text-xs text-zinc-600">
          {usage.count}/{5} messages used today
        </div>
      </div>
    </div>
  );
}
