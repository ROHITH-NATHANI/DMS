import React, { useState, useRef } from 'react';
import { Send, User, Bot, Loader2, Volume2 } from 'lucide-react';
import { getPsychologicalSupport } from '../services/geminiService';
import { cn } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello. I am your Disaster Response AI. How can I help you today? Whether you need safety instructions, psychological support, or information on relief, I am here.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await getPsychologicalSupport(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that. Please try again." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI service. Please check your connection." }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
      <div className="p-4 border-bottom bg-zinc-50 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider">AI Support Assistant</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-zinc-900 text-white" : "bg-emerald-100 text-emerald-700"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "max-w-[80%] p-3 rounded-2xl text-sm relative group",
              msg.role === 'user' ? "bg-zinc-900 text-white rounded-tr-none" : "bg-zinc-100 text-zinc-800 rounded-tl-none"
            )}>
              {msg.content}
              {msg.role === 'assistant' && (
                <button 
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(msg.content);
                    window.speechSynthesis.speak(utterance);
                  }}
                  className="absolute -right-8 top-0 p-1 text-zinc-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Volume2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <div className="bg-zinc-100 p-3 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for help or instructions..."
            className="w-full bg-zinc-100 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
