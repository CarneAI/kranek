import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Code, Settings, History, Menu, X, Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: 'chat' | 'code';
  setActiveView: (view: 'chat' | 'code') => void;
  onNewChat: () => void;
}

export function Layout({ children, sidebarOpen, setSidebarOpen, activeView, setActiveView, onNewChat }: LayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col"
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Web Builder
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-zinc-800 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
            <button 
                onClick={() => {
                    onNewChat();
                    if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm"
            >
                <MessageSquare size={16} />
                New Chat
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">History</div>
          {/* Placeholder history items */}
          <div className="p-2 hover:bg-zinc-800 rounded cursor-pointer text-sm truncate text-zinc-400 flex items-center gap-2">
            <History size={14} />
            <span>Landing Page for SaaS</span>
          </div>
          <div className="p-2 hover:bg-zinc-800 rounded cursor-pointer text-sm truncate text-zinc-400 flex items-center gap-2">
            <History size={14} />
            <span>Portfolio Website</span>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Settings size={16} />
            <span>Settings</span>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        {/* Header */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            
            {/* View Switcher */}
            <div className="flex bg-zinc-900 p-1 rounded-lg">
              <button
                onClick={() => setActiveView('chat')}
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                  activeView === 'chat' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <MessageSquare size={16} />
                Chat
              </button>
              <button
                onClick={() => setActiveView('code')}
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                  activeView === 'code' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Code size={16} />
                Code & Preview
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 bg-zinc-900 rounded-lg p-1">
                <div className="p-1.5 hover:bg-zinc-800 rounded cursor-pointer text-zinc-400 hover:text-white" title="Mobile View">
                    <Smartphone size={16} />
                </div>
                <div className="p-1.5 hover:bg-zinc-800 rounded cursor-pointer text-zinc-400 hover:text-white" title="Tablet View">
                    <Tablet size={16} />
                </div>
                <div className="p-1.5 bg-zinc-800 rounded cursor-pointer text-white shadow-sm" title="Desktop View">
                    <Monitor size={16} />
                </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
