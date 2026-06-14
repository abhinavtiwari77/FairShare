import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { socket, connectSocket, disconnectSocket } from '../../lib/socket';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export default function ExpenseChat({ expenseId, isAdmin }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', expenseId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/expenses/${expenseId}/messages`);
      return res.data.messages;
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    connectSocket();
    socket.emit('join:expense', { expenseId });

    const handleNewMessage = (msg) => {
      queryClient.setQueryData(['messages', expenseId], (oldData) => {
        if (!oldData) return [msg];
        if (oldData.some(m => m.id === msg.id)) return oldData;
        
        // Find if we have an optimistic message for this exact text and sender
        const tempIndex = oldData.findIndex(m => m.id.startsWith('temp-') && m.text === msg.text && m.sender.id === msg.sender.id);
        if (tempIndex !== -1) {
          const newData = [...oldData];
          newData[tempIndex] = msg;
          return newData;
        }
        
        return [...oldData, msg];
      });
    };

    const handleMessageDeleted = ({ messageId }) => {
      queryClient.setQueryData(['messages', expenseId], (oldData) => {
        if (!oldData) return [];
        return oldData.filter(m => m.id !== messageId);
      });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
      disconnectSocket();
    };
  }, [expenseId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (text) => api.post(`/api/v1/expenses/${expenseId}/messages`, { text }),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['messages', expenseId] });
      const previousMessages = queryClient.getQueryData(['messages', expenseId]);
      
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        sender: user
      };

      queryClient.setQueryData(['messages', expenseId], (oldData) => {
        if (!oldData) return [optimisticMessage];
        return [...oldData, optimisticMessage];
      });

      setNewMessage('');
      
      return { previousMessages, optimisticMessage };
    },
    onSuccess: (res, variables, context) => {
      queryClient.setQueryData(['messages', expenseId], (oldData) => {
        if (!oldData) return [];
        const hasReal = oldData.some(m => m.id === res.data.message.id);
        if (hasReal) {
          return oldData.filter(m => m.id !== context.optimisticMessage.id);
        }
        return oldData.map(m => m.id === context.optimisticMessage.id ? res.data.message : m);
      });
    },
    onError: (err, newText, context) => {
      queryClient.setQueryData(['messages', expenseId], context.previousMessages);
      setError(err.response?.data?.error || 'Failed to send message');
      setNewMessage(newText);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId) => api.delete(`/api/v1/expenses/${expenseId}/messages/${messageId}`),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ['messages', expenseId] });
      const previousMessages = queryClient.getQueryData(['messages', expenseId]);

      queryClient.setQueryData(['messages', expenseId], (oldData) => {
        if (!oldData) return [];
        return oldData.filter(m => m.id !== messageId);
      });

      return { previousMessages };
    },
    onError: (err, messageId, context) => {
      queryClient.setQueryData(['messages', expenseId], context.previousMessages);
      setError(err.response?.data?.error || 'Failed to delete message');
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage.trim());
  };

  const handleDeleteMessage = (messageId) => {
    if (messageId.startsWith('temp-')) return;
    deleteMutation.mutate(messageId);
  };

  if (isLoading) return <div className="p-4 text-center text-muted-foreground text-sm">Loading chat...</div>;

  return (
    <Card className="flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Expense Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/10">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm italic mt-10">No messages yet. Be the first to say something!</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender.id === user?.id;
            const canDelete = isMe || isAdmin;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-xs font-medium text-foreground">{isMe ? 'You' : msg.sender.fullName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="group relative max-w-[85%]">
                  <div className={`px-4 py-2 text-sm rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border shadow-sm text-card-foreground rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className={`absolute top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all ${isMe ? '-left-10' : '-right-10'}`}
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {error && <div className="px-4 py-2 text-xs text-destructive bg-destructive/10 border-t">{error}</div>}
      <div className="p-4 bg-card border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              setError(null);
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-full px-4"
            maxLength={2000}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            size="icon"
            className="rounded-full shrink-0"
          >
            <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
