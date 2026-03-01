import React, { useEffect, useState, useRef } from 'react';
import { FileCode, Play, RefreshCw, Maximize2, Minimize2, Eye, Code as CodeIcon, Download } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface CodePreviewProps {
  code: string;
}

interface FileData {
  name: string;
  language: string;
  content: string;
}

export function CodePreview({ code }: CodePreviewProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Parse code blocks from markdown
  useEffect(() => {
    // Regex to capture: ```language filename \n content ```
    // We handle cases where filename might be missing or on the same line
    const regex = /```(\w+)?(?:[ \t]+([^\n]+))?\n([\s\S]*?)```/g;
    const newFiles: FileData[] = [];
    let match;

    // We need to handle the case where the code is still streaming and the closing ``` is missing
    // But the regex requires the closing ```. 
    // For streaming, we might need a more lenient parser or just accept that the last block updates in chunks.
    // The current regex requires the closing ``` so the last block won't appear until finished or at least until the next block starts?
    // Actually, `[\s\S]*?` is non-greedy, so it waits for the next ```.
    // If the stream ends without a closing ```, it might fail.
    // Let's try to append a closing ``` if it's missing at the end of the string for parsing purposes.
    
    const codeToParse = code + "\n```"; 

    while ((match = regex.exec(codeToParse)) !== null) {
      // If the match is empty or just the appended backticks, skip
      if (match[0].trim() === '```') continue;

      const language = match[1] || 'text';
      let filename = match[2]?.trim();
      const content = match[3];

      // Heuristics for filename if missing
      if (!filename) {
        if (language === 'html') filename = 'index.html';
        else if (language === 'css') filename = 'style.css';
        else if (language === 'js' || language === 'javascript') filename = 'script.js';
        else filename = `file.${language}`;
      }

      // Check if file already exists in this parse run (update it)
      const existingIdx = newFiles.findIndex(f => f.name === filename);
      if (existingIdx >= 0) {
        newFiles[existingIdx].content = content;
      } else {
        newFiles.push({
          name: filename,
          language,
          content
        });
      }
    }

    setFiles(newFiles);
    if (newFiles.length > 0 && !activeFile) {
      setActiveFile(newFiles[0].name);
    }
  }, [code]);

  // Generate preview content
  const generatePreview = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html'))?.content || '';
    const cssFile = files.find(f => f.name.endsWith('.css'))?.content || '';
    const jsFile = files.find(f => f.name.endsWith('.js'))?.content || '';

    if (!htmlFile) return '';

    // Create a complete HTML document
    // We inject the CSS and JS directly to ensure they run in the iframe
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>${cssFile}</style>
        </head>
        <body>
          ${htmlFile}
          <script>${jsFile}<\/script>
        </body>
      </html>
    `;
  };

  const updateIframe = () => {
    if (iframeRef.current) {
      const previewContent = generatePreview();
      iframeRef.current.srcdoc = previewContent;
    }
  };

  useEffect(() => {
    const timer = setTimeout(updateIframe, 1000);
    return () => clearTimeout(timer);
  }, [files]);

  return (
    <div className={cn("flex flex-col h-full bg-zinc-900", isFullscreen && "fixed inset-0 z-50")}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[60%]">
          {files.map(file => (
            <button
              key={file.name}
              onClick={() => {
                setActiveFile(file.name);
                if (window.innerWidth < 768) setViewMode('code');
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap",
                activeFile === file.name 
                  ? "bg-zinc-800 text-blue-400 border border-blue-500/30" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
            >
              <FileCode size={14} />
              {file.name}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile View Toggles */}
          <div className="flex md:hidden bg-zinc-800 rounded p-0.5">
            <button 
                onClick={() => setViewMode('code')}
                className={cn("p-1.5 rounded", viewMode === 'code' ? "bg-zinc-700 text-white" : "text-zinc-400")}
            >
                <CodeIcon size={14} />
            </button>
            <button 
                onClick={() => setViewMode('preview')}
                className={cn("p-1.5 rounded", viewMode === 'preview' ? "bg-zinc-700 text-white" : "text-zinc-400")}
            >
                <Eye size={14} />
            </button>
          </div>

          <button 
            onClick={updateIframe}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-green-400" 
            title="Refresh Preview"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Code Editor View */}
        <div className={cn(
          "flex-1 overflow-hidden border-r border-zinc-800 bg-[#1e1e1e] transition-all",
          // Mobile logic
          viewMode === 'preview' ? "hidden md:flex" : "flex"
        )}>
          {activeFile ? (
            <div className="w-full h-full overflow-auto custom-scrollbar">
               <SyntaxHighlighter
                language={files.find(f => f.name === activeFile)?.language || 'text'}
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '14px', lineHeight: '1.5' }}
                showLineNumbers={true}
                wrapLines={true}
              >
                {files.find(f => f.name === activeFile)?.content || ''}
              </SyntaxHighlighter>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-zinc-600 text-sm gap-2">
              <CodeIcon size={32} className="opacity-20" />
              <p>Waiting for code generation...</p>
            </div>
          )}
        </div>

        {/* Preview View */}
        <div className={cn(
          "flex-1 bg-white relative transition-all",
          // Mobile logic
          viewMode === 'code' ? "hidden md:flex" : "flex"
        )}>
          <iframe
            ref={iframeRef}
            title="Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
          />
          {/* Overlay for loading state if needed */}
        </div>
      </div>
    </div>
  );
}
