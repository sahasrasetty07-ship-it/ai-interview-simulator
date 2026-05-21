import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Cpu, Sparkles, X } from 'lucide-react';

export default function MentorChat({ role, resumeSummary, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'mentor',
      text: `Hello! I'm your AI Career Advisor. I have configured my guidance profile for your target role of '${role}'. Feel free to ask me questions regarding resume improvements, system design practice, or salary negotiations.`
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setInputMsg("");
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: userText
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: {
            role: role,
            resume_summary: resumeSummary || "Not uploaded yet"
          }
        })
      });
      
      const data = await response.json();
      
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'mentor',
        text: data.reply || "Failed to contact advisor core. Please check your local server."
      }]);
    } catch (err) {
      console.warn("Failed to fetch mentor response: ", err);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'mentor',
          text: `It looks like the backend server is offline, but here is a quick tip: To stand out as a candidate, make sure you explain system trade-offs explicitly during technical questions rather than just naming technologies.`
        }]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card border-l border-saas-border dark:border-dark-border w-full max-w-sm md:max-w-md shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-saas-slate50 dark:bg-dark-bg border-b border-saas-border dark:border-dark-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-saas-indigo/15 text-saas-indigo border border-saas-indigo/25">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-saas-slate900 dark:text-white flex items-center gap-1">
              AI Career Mentor
              <Sparkles className="w-3 h-3 text-saas-violet animate-pulse" />
            </span>
            <span className="text-[10px] text-saas-emerald font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-saas-emerald animate-pulse" />
              Online
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-saas-slate100 dark:hover:bg-saas-slate800 text-saas-muted dark:text-dark-muted hover:text-saas-slate700 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message History */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${
            msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
          }`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
              msg.sender === 'user' 
                ? 'bg-saas-slate100 dark:bg-saas-slate800 border-saas-slate200 dark:border-dark-border text-saas-slate700 dark:text-dark-text' 
                : 'bg-saas-indigo/10 border-saas-indigo/30 text-saas-indigo'
            }`}>
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
            </div>

            {/* Bubble */}
            <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
              msg.sender === 'user'
                ? 'bg-saas-indigo text-white border-saas-indigo'
                : 'bg-saas-slate100 dark:bg-dark-bg/80 border-saas-border dark:border-dark-border text-saas-slate800 dark:text-dark-text'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5 self-start items-center">
            <div className="w-7 h-7 rounded-full border bg-saas-indigo/10 border-saas-indigo/30 text-saas-indigo flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 animate-spin-slow" />
            </div>
            <div className="p-3 rounded-2xl bg-saas-slate100 dark:bg-dark-bg/80 border border-saas-border dark:border-dark-border text-saas-muted text-xs flex items-center gap-1.5">
              Formulating tips
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-saas-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-saas-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-saas-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-dark-card border-t border-saas-border dark:border-dark-border flex gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Ask a question..."
          className="flex-grow bg-saas-slate50 dark:bg-dark-bg/40 border border-saas-border dark:border-dark-border/80 rounded-xl px-4 py-2 text-xs text-saas-slate900 dark:text-white focus:outline-none focus:border-saas-indigo transition-colors placeholder:text-saas-muted/40"
        />
        <button
          type="submit"
          className="p-2.5 bg-saas-indigo hover:bg-saas-indigo/90 text-white rounded-xl transition-all duration-300 shadow-sm flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
