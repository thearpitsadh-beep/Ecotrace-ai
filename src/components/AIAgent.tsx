import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Smile, Activity, Mic, MicOff, Paperclip, X, Image as ImageIcon, Leaf } from 'lucide-react';
import { motion } from 'motion/react';
import { CarbonActivity } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  pendingActivity?: Omit<CarbonActivity, 'id' | 'date'>;
  attachment?: {
    mimeType: string;
    data: string;
  };
}

interface AIAgentProps {
  onLogActivity: (activity: Omit<CarbonActivity, 'id' | 'date'>) => void;
  activities: CarbonActivity[];
}

export function AIAgent({ onLogActivity, activities }: AIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([{

    id: 'welcome',
    role: 'model',
    content: "Hi friend! 👋 I'm EcoBuddy! Tell me what you ate today, where you gone, how you traveled, or what you bought. I love hearing about your day, and I'll help you see how it impacts our beautiful planet! 🌍"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tipOfTheDay, setTipOfTheDay] = useState("");
  
  const [isListening, setIsListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{data: string, mimeType: string, name: string} | null>(null);

  useEffect(() => {
    if (!activities || activities.length === 0) {
      setTipOfTheDay("Log your first activity to get personalized green tips!");
      return;
    }
    const aggregatedData = activities.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + curr.co2ImpactKg;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(aggregatedData).sort((a,b) => b[1] - a[1])[0][0];

    const tips: Record<string, string> = {
      transport: "💡 Tip: Transport is your top emission! Try carpooling or taking the metro today. 🚇",
      diet: "💡 Tip: Food is your top emission! A plant-based meal today saves significant emissions. 🥗",
      energy: "💡 Tip: Energy is your top emission! Turn off appliances when not in use. 🔌",
      shopping: "💡 Tip: Shopping is your top emission! Try supporting local or sustainable brands. 🛍️",
      water: "💡 Tip: Conserve water and energy by reducing shower times! 💧"
    };
    
    setTipOfTheDay(tips[topCategory] || "💡 Tip: Small daily actions make a huge difference for our planet! 🌍");
  }, [activities]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice recognition.");
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const base64Content = base64Data.split(',')[1];
      setSelectedFile({
        data: base64Content,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const finalInput = overrideInput !== undefined ? overrideInput : input;
    if ((!finalInput.trim() && !selectedFile) || isLoading) return;

    const userMsg: Message = { 
      id: crypto.randomUUID(), 
      role: 'user', 
      content: finalInput,
      attachment: selectedFile ? { mimeType: selectedFile.mimeType, data: selectedFile.data } : undefined
    };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: newMessages.map(m => ({
            role: m.role, 
            content: m.content,
            attachment: m.attachment
          })) 
        }),
      });

      if (!response.ok) {
        let errorData = null;
        const errorText = await response.text().catch(() => "");
        try { errorData = JSON.parse(errorText); } catch(e) {}
        
        if (errorData?.reply) {
          // Use graceful fallback reply from server directly
          setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', content: errorData.reply }]);
          return;
        }
        
        throw new Error(errorData?.error || 'Chat API failed');
      }

      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Received invalid format from chat API");
      }
      
      const newModelMsg: Message = { id: crypto.randomUUID(), role: 'model', content: data.reply };
      
      if (data.autoLoggedActivity) {
         newModelMsg.pendingActivity = data.autoLoggedActivity;
      }

      setMessages(prev => [...prev, newModelMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message && error.message !== 'Chat API failed' 
        ? `Oh no! 🙈 ${error.message}` 
        : "Oh no! 🙈 I'm having trouble connecting right now. Can we try again later?";
        
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'model', content: errorMsg }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-emerald-100 animate-bounce-slow">
            <Smile size={24} />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 block leading-none mb-1">EcoBuddy</span>
            <span className="text-xs text-emerald-600 font-medium">Online & ready to chat!</span>
          </div>
        </div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
      </div>

      {tipOfTheDay && (
        <div className="bg-emerald-50 border-b border-emerald-100 flex items-center justify-center p-2 text-xs font-medium text-emerald-800 animate-in fade-in slide-in-from-top-2">
          {tipOfTheDay}
        </div>
      )}

      <div 
        ref={scrollRef} 
        aria-live="polite" 
        role="log" 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-[300px] sm:min-h-[400px] bg-slate-50/50"
      >
        {messages.map((m, index) => {
          if (index === 0 && m.id === 'welcome' && messages.length === 1) {
            return (
              <div key="welcome-mascot" className="flex flex-col items-center justify-center py-6 sm:py-10 animate-in fade-in zoom-in duration-500">
                <motion.div 
                  animate={{ y: [0, -15, 0] }} 
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 mb-8"
                >
                  {/* 3D Sphere */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-emerald-600 rounded-full shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.2),_15px_15px_30px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center overflow-hidden border-2 border-emerald-500/20">
                    
                    {/* Glossy highlight */}
                    <div className="absolute top-2 left-4 w-12 h-6 bg-white/40 rounded-full blur-[2px] transform -rotate-12" />
                    
                    {/* Landmasses for Earth look */}
                    <div className="absolute top-4 left-4 w-12 h-8 bg-green-400 rounded-full opacity-60 mix-blend-overlay rotate-[20deg]" />
                    <div className="absolute bottom-6 right-2 w-16 h-10 bg-green-400 rounded-full opacity-60 mix-blend-overlay rotate-[-10deg]" />
                    <div className="absolute top-12 -left-4 w-10 h-10 bg-green-400 rounded-full opacity-60 mix-blend-overlay rotate-[40deg]" />
                    
                    {/* Cute Face */}
                    <div className="relative flex flex-col items-center mt-3 z-10">
                        {/* Eyes */}
                        <div className="flex gap-5 mb-1.5">
                           <div className="w-3.5 h-4 sm:w-4 sm:h-5 bg-slate-800 rounded-full shadow-sm relative">
                             <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                           </div>
                           <div className="w-3.5 h-4 sm:w-4 sm:h-5 bg-slate-800 rounded-full shadow-sm relative">
                             <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                           </div>
                        </div>
                        {/* Smile */}
                        <div className="w-4 h-2 sm:w-5 sm:h-2.5 border-b-[3px] border-slate-800 rounded-b-full opacity-90" />
                        
                        {/* Pink Cheeks */}
                        <div className="absolute top-2 -left-4 w-3 h-2 bg-pink-400 rounded-full blur-[2px] opacity-70" />
                        <div className="absolute top-2 -right-4 w-3 h-2 bg-pink-400 rounded-full blur-[2px] opacity-70" />
                    </div>
                  </div>
                  
                  {/* Little floating friend (leaf) */}
                  <motion.div 
                    animate={{ y: [0, 8, 0], rotate: [0, 15, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }}
                    className="absolute -top-3 -right-5 text-emerald-500 drop-shadow-md z-20 bg-white/80 p-2 rounded-full border border-emerald-100"
                  >
                     <Leaf size={24} className="fill-emerald-200" />
                  </motion.div>
                </motion.div>

                <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-md shadow-emerald-900/5 border border-emerald-100 max-w-sm text-center relative mx-4">
                   {/* Speech bubble pointer */}
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-t border-l border-emerald-100 transform rotate-45" />
                   
                   <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
                     <span className="text-2xl">👋</span> Hi! I'm EcoBuddy
                   </h3>
                   <p className="text-slate-600 text-sm leading-relaxed">
                     Tell me what you ate today, where you traveled, or what you bought. I love hearing about your day, and I'll help you see how it impacts our beautiful planet! 🌍
                   </p>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-2 flex-shrink-0 mt-1">
                  <Smile size={16} />
                </div>
              )}
              
              <div className="flex flex-col">
                <div className={`max-w-[100%] sm:max-w-md p-4 rounded-3xl text-[15px] shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-sm' 
                    : 'bg-white text-slate-700 rounded-tl-sm border border-slate-100'
                }`}>
                  {m.attachment && m.attachment.mimeType.startsWith('image/') && (
                    <img src={`data:${m.attachment.mimeType};base64,${m.attachment.data}`} className="max-w-full h-auto rounded-xl mb-3 border border-slate-700/30" alt="Uploaded" />
                  )}
                  {m.attachment && !m.attachment.mimeType.startsWith('image/') && (
                    <div className="mb-3 p-2 bg-slate-800 rounded-xl flex items-center gap-2">
                      <Paperclip size={16} />
                      <span className="text-xs">Attachment included</span>
                    </div>
                  )}
                  <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>
                  
                  {m.pendingActivity && (
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 dark:bg-slate-800/50 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Log this activity?</p>
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{m.pendingActivity.title}</span>
                          <span className="text-xs text-slate-500 capitalize">{m.pendingActivity.type} • {m.pendingActivity.co2ImpactKg}kg CO₂e</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            onLogActivity(m.pendingActivity!);
                            setMessages(prev => prev.map(msg => msg.id === m.id ? {
                              ...msg, 
                              pendingActivity: undefined, 
                              content: msg.content + `\n\n✅ Added **${msg.pendingActivity!.title}** (${msg.pendingActivity!.co2ImpactKg}kg CO₂e)`
                            } : msg));
                          }}
                          aria-label="Confirm and Log Activity"
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          Confirm & Log
                        </button>
                        <button 
                          onClick={() => {
                            setMessages(prev => prev.map(msg => msg.id === m.id ? {...msg, pendingActivity: undefined} : msg));
                          }}
                          aria-label="Cancel Log Activity"
                          className="flex-1 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {m.role === 'user' && (
                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 ml-2 flex-shrink-0 mt-1">
                 <User size={16} />
               </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-2 flex-shrink-0 mt-1">
               <Smile size={16} />
            </div>
            <div className="bg-white text-slate-500 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2 shadow-sm">
               <Loader2 size={16} className="animate-spin text-emerald-500" />
               <span className="text-sm font-medium">Thinking about how to help the planet...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-slate-100 bg-white relative shrink-0">
        {!isLoading && messages.length < 3 && (
           <div className="flex flex-wrap gap-2 mb-3">
             {["I took the bus 🚌", "I ate a plant-based meal 🥗", "I reused my bags 🛍️"].map((action) => (
                <button
                  key={action}
                  type="button"
                  aria-label={`Quick reply: ${action}`}
                  onClick={() => handleSubmit(undefined, action)}
                  className="text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors border border-emerald-100 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  {action}
                </button>
             ))}
           </div>
        )}
        {selectedFile && (
          <div className="absolute bottom-full left-4 right-4 mb-2 p-2 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 shadow-sm z-10 transition-all">
            <div className="flex items-center gap-2 text-sm text-slate-700 truncate pr-4">
              <ImageIcon size={16} className="text-emerald-500" />
              <span className="truncate">{selectedFile.name}</span>
            </div>
            <button type="button" onClick={() => setSelectedFile(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="relative flex items-center gap-2">
          <label 
            htmlFor="file-upload"
            aria-label="Upload an image"
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
            <Paperclip size={18} />
            <input 
              id="file-upload"
              type="file" 
              accept="image/*" 
              className="sr-only" 
              onChange={handleFileChange}
            />
          </label>
          <button
            type="button"
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            onClick={toggleListening}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl transition-colors border shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              isListening ? 'bg-red-50 text-red-500 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
            }`}
             title={isListening ? "Stop listening" : "Start Voice Input"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          
          <div className="relative flex-1">
            <input
              id="chat-input"
              aria-label="Chat input"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 pr-14 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all shadow-inner text-base sm:text-sm"
              value={input}
              disabled={isLoading}
              placeholder={isListening ? "Listening..." : "Ex: I had a burger for lunch..."}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={isLoading || (!input.trim() && !selectedFile)}
              className="absolute right-2 top-2 bottom-2 bg-emerald-500 text-white px-3 sm:px-4 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center shadow-md shadow-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Send size={18} className="translate-x-0.5" />
            </button>
          </div>
        </div>
        <div className="text-center mt-2">
           <span className="text-[11px] text-slate-400 font-medium">EcoBuddy uses AI to calculate your footprint automatically</span>
        </div>
      </form>
    </div>
  );
}
