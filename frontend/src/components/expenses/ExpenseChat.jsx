import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { socket, connectSocket, disconnectSocket } from '../../lib/socket';

export default function ExpenseChat({ expenseId, isAdmin }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let mounted = true;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/expenses/${expenseId}/messages`);
        if (mounted) {
          setMessages(res.data.messages);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setError(err.response?.data?.error || 'Failed to load messages');
      }
    };

    fetchMessages();

    // Setup Socket
    connectSocket();
    
    // Once connected, join the expense room
    socket.emit('join:expense', { expenseId });

    const handleNewMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      mounted = false;
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
      disconnectSocket();
    };
  }, [expenseId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post(`/expenses/${expenseId}/messages`, { text: newMessage.trim() });
      setNewMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/expenses/${expenseId}/messages/${messageId}`);
      // Will be removed via socket event, but we could optimistic delete too
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete message');
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading chat...</div>;

  return (
    <div className="flex flex-col h-[500px] border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Expense Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 italic mt-10">No messages yet. Be the first to say something!</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender.id === user?.id;
            const canDelete = isMe || isAdmin;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-xs font-medium text-gray-600">{isMe ? 'You' : msg.sender.fullName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="group relative max-w-[80%]">
                  <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className={`absolute top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? '-left-8' : '-right-8'}`}
                      title="Delete message"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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
      {error && <div className="px-4 text-xs text-red-500 bg-red-50 py-1">{error}</div>}
      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              setError(null);
            }}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-indigo-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4 translate-x-[1px] translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
