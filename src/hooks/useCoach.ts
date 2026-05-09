import { useState, useCallback } from 'react';
import { getCoachResponse } from '../services/ai/coachService';
import { getPatientContext } from '../services/ai/contextService';
import { runSafetyCheck } from '../services/ai/safetyGuardrail';
import { ChatMessage } from '../types/ai';

export function useCoach(userId: string, activeProfile: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !userId) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setError(null);

    try {
      const context = await getPatientContext(userId, activeProfile);
      
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ 
          role: m.role as 'user' | 'assistant', 
          content: m.content 
        }));

      const stream = await getCoachResponse(context, text, history);
      
      let assistantContent = "";
      
      // Add initial empty assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      for await (const chunk of stream) {
        assistantContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = assistantContent;
          }
          return [...newMessages];
        });
      }

      // Final safety check
      const safety = runSafetyCheck(assistantContent);
      if (!safety.passed) {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = safety.modifiedContent;
          }
          return [...newMessages];
        });
      }

    } catch (err) {
      console.error("Coach error:", err);
      setError("I'm having trouble connecting to my clinical brain. Please try again in a moment.");
    } finally {
      setIsTyping(false);
    }
  }, [userId, activeProfile, messages]);

  return {
    messages,
    sendMessage,
    isTyping,
    error
  };
}
