import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import './MessagingModule.css';

// Main Messaging Component with Mobile Support
const MessagingPage = ({ isEmbedded = false, onClose }) => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations with unread counts
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get conversations where user is participant
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id)
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (convError && convError.code !== 'PGRST116') {
        // If no conversations table, fallback to direct messages
        await fetchDirectMessages();
        return;
      }

      if (!convData || convData.length === 0) {
        await fetchDirectMessages();
        return;
      }

      // Get last message and participant info for each conversation
      const conversationsWithData = await Promise.all(
        (convData || []).map(async (conv) => {
          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('sent_at', { ascending: false })
            .limit(1)
            .single();

          // Get other participant info
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id, profiles(id, email, role, full_name, avatar_url)')
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id);

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          return {
            ...conv,
            last_message: lastMsg,
            other_participant: participants?.[0]?.profiles || null,
            unread_count: unreadCount || 0
          };
        })
      );

      // Sort by most recent
      conversationsWithData.sort((a, b) => 
        new Date(b.last_message?.created_at || b.updated_at) - 
        new Date(a.last_message?.created_at || a.updated_at)
      );

      setConversations(conversationsWithData);
      
      // Calculate total unread
      const totalUnread = conversationsWithData.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setUnreadCounts({ total: totalUnread });

    } catch (err) {
      console.error('Error fetching conversations:', err);
      await fetchDirectMessages();
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fallback: Fetch direct messages (if no conversations table)
  const fetchDirectMessages = async () => {
    try {
      // Get unique conversations from direct messages
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, email, role, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, email, role, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Group by other user
      const convMap = {};
      messagesData.forEach(msg => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        
        if (!convMap[otherUserId]) {
          convMap[otherUserId] = {
            id: `dm-${otherUserId}`,
            is_direct: true,
            other_participant: otherUser,
            last_message: msg,
            unread_count: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
            updated_at: msg.created_at
          };
        } else if (msg.receiver_id === user.id && !msg.is_read) {
          convMap[otherUserId].unread_count++;
        }
      });

      const directConversations = Object.values(convMap);
      setConversations(directConversations);
      
      const totalUnread = directConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setUnreadCounts({ total: totalUnread });
    } catch (err) {
      console.error('Error fetching direct messages:', err);
      setError('Gagal memuat pesan');
    } finally {
      setLoading(false);
    }
  };

  // Fetch contacts (other users to start chat with)
  const fetchContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, full_name, avatar_url')
        .neq('id', user?.id)
        .order('email', { ascending: true })
        .limit(100);

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err.message);
    }
  }, [user]);

  // Fetch initial data
  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, [fetchConversations, fetchContacts]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messaging-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchConversations();
          
          // If viewing this conversation, add message
          if (selectedConversation) {
            const otherUserId = selectedConversation.is_direct 
              ? selectedConversation.other_participant?.id 
              : null;
            
            if (payload.new.sender_id === otherUserId || selectedConversation.is_direct === false) {
              setMessages(prev => [...prev, payload.new]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation, fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversation) => {
    try {
      setLoading(true);
      
      if (conversation.is_direct) {
        // Direct messages
        const otherUserId = conversation.other_participant?.id;
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles!messages_sender_id_fkey(id, email, role, full_name, avatar_url)')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
          .order('sent_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } else {
        // Conversation messages
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles!messages_sender_id_fkey(id, email, role, full_name, avatar_url)')
          .eq('conversation_id', conversation.id)
          .order('sent_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      }

      // Mark messages as read
      if (conversation.is_direct) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('receiver_id', user.id)
          .eq('sender_id', conversation.other_participant?.id);
      }

      setShowChatView(true);
    } catch (err) {
      setError('Gagal memuat pesan: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation);
  };

  const handleBackToList = () => {
    setShowChatView(false);
    setSelectedConversation(null);
    fetchConversations();
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);

      const messageData = {
        sender_id: user.id,
        content: newMessage.trim(),
        is_read: false,
        sent_at: new Date().toISOString()
      };

      if (selectedConversation.is_direct) {
        messageData.receiver_id = selectedConversation.other_participant?.id;
      } else {
        messageData.conversation_id = selectedConversation.id;
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation);
      fetchConversations();
    } catch (err) {
      setError('Gagal mengirim pesan: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = async () => {
    if (!selectedContact) {
      alert('Pilih kontak terlebih dahulu');
      return;
    }

    try {
      setSending(true);

      // Check if direct conversation already exists
      const { data: existingMsg } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`)
        .limit(1)
        .single();

      if (existingMsg) {
        // Create a virtual conversation
        const conv = {
          id: `dm-${selectedContact.id}`,
          is_direct: true,
          other_participant: selectedContact,
          last_message: null,
          unread_count: 0
        };
        setSelectedConversation(conv);
        setMessages([]);
        setShowNewChat(false);
        setShowChatView(true);
        setSending(false);
        return;
      }

      // Send first message to create conversation
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          content: newMessage.trim() || 'Hai!',
          is_read: false
        });

      if (error) throw error;

      setNewMessage('');
      setShowNewChat(false);
      fetchConversations();
      
      // Select the new conversation
      const newConv = {
        id: `dm-${selectedContact.id}`,
        is_direct: true,
        other_participant: selectedContact,
        last_message: null,
        unread_count: 0
      };
      setSelectedConversation(newConv);
      setMessages([]);
      setShowChatView(true);
      
    } catch (err) {
      setError('Gagal memulai percakapan: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // Get display name for user
  const getDisplayName = (participant) => {
    if (!participant) return 'Unknown';
    if (participant.full_name) return participant.full_name;
    if (participant.email) return participant.email.split('@')[0];
    return 'Pengguna';
  };

  // Filter contacts by search
  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase();
    return (
      contact.email?.toLowerCase().includes(search) ||
      contact.full_name?.toLowerCase().includes(search) ||
      contact.role?.toLowerCase().includes(search)
    );
  });

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'guru': return '#10b981';
      case 'admin': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Render conversations list
  const renderConversationsList = () => (
    <div className="conversations-panel">
      <div className="conversations-header">
        <div className="header-top">
          <h2>
            {isEmbedded && onClose ? (
              <button className="back-btn" onClick={onClose}>←</button>
            ) : null}
            Pesan
            {unreadCounts.total > 0 && (
              <span className="unread-badge">{unreadCounts.total}</span>
            )}
          </h2>
          <button 
            onClick={() => setShowNewChat(true)}
            className="btn-icon"
            title="Percakapan Baru"
          >
            ✏️
          </button>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Cari percakapan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat percakapan...</p>
        </div>
      ) : conversations.length > 0 ? (
        <div className="conversations-list">
          {conversations
            .filter(conv => {
              if (!searchTerm) return true;
              const name = getDisplayName(conv.other_participant).toLowerCase();
              return name.includes(searchTerm.toLowerCase());
            })
            .map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.unread_count > 0 ? 'unread' : ''}`}
              onClick={() => handleSelectConversation(conv)}
            >
              <div className="conv-avatar">
                {conv.other_participant?.avatar_url ? (
                  <img src={conv.other_participant.avatar_url} alt="" />
                ) : (
                  getDisplayName(conv.other_participant).charAt(0).toUpperCase()
                )}
              </div>
              <div className="conv-content">
                <div className="conv-header">
                  <span className="conv-name">{getDisplayName(conv.other_participant)}</span>
                  <span className="conv-time">
                    {conv.last_message 
                      ? formatTime(conv.last_message.sent_at)
                      : ''}
                  </span>
                </div>
                <div className="conv-preview">
                  <span className="preview-text">
                    {conv.is_direct ? '💬' : '👥'} 
                    {conv.last_message?.content?.substring(0, 40) || 'Belum ada pesan'}
                    {conv.last_message?.content?.length > 40 ? '...' : ''}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="unread-count">{conv.unread_count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">💬</span>
          <p>Belum ada percakapan</p>
          <button 
            onClick={() => setShowNewChat(true)}
            className="btn btn-primary"
          >
            Mulai Percakapan
          </button>
        </div>
      )}
    </div>
  );

  // Render chat area
  const renderChatArea = () => (
    <div className="chat-panel">
      <div className="chat-header">
        <button className="back-btn" onClick={handleBackToList}>←</button>
        <div className="chat-user-info">
          <div className="chat-avatar-small">
            {selectedConversation.other_participant?.avatar_url ? (
              <img src={selectedConversation.other_participant.avatar_url} alt="" />
            ) : (
              getDisplayName(selectedConversation.other_participant).charAt(0).toUpperCase()
            )}
          </div>
          <div className="chat-user-details">
            <span className="chat-user-name">
              {getDisplayName(selectedConversation.other_participant)}
            </span>
            <span 
              className="chat-user-role"
              style={{ color: getRoleBadgeColor(selectedConversation.other_participant?.role) }}
            >
              {selectedConversation.other_participant?.role || 'Pengguna'}
            </span>
          </div>
        </div>
        <button className="btn-icon" title="Info">ℹ️</button>
      </div>

      <div className="messages-area">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
          </div>
        ) : messages.length > 0 ? (
          <div className="messages-list">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`message-bubble ${msg.sender_id === user.id ? 'sent' : 'received'}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-meta">
                  <span className="message-time">
                    {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender_id === user.id && (
                    <span className="message-status">
                      {msg.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="no-messages">
            <span className="empty-icon">💬</span>
            <p>Belum ada pesan</p>
            <p className="hint">Kirim pesan untuk memulai percakapan</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="message-input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ketik pesan..."
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={sending || !newMessage.trim()}
          className="btn btn-primary send-btn"
        >
          {sending ? '...' : '➤'}
        </button>
      </form>
    </div>
  );

  // Render new chat modal
  const renderNewChatModal = () => (
    <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
      <div className="modal-content new-chat-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Percakapan Baru</h2>
          <button onClick={() => setShowNewChat(false)} className="modal-close">&times;</button>
        </div>

        <div className="search-box" style={{ padding: '0 1rem' }}>
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="contacts-list">
          {filteredContacts.length > 0 ? (
            filteredContacts.map(contact => (
              <div
                key={contact.id}
                className={`contact-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="contact-avatar">
                  {contact.avatar_url ? (
                    <img src={contact.avatar_url} alt="" />
                  ) : (
                    contact.email.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="contact-info">
                  <div className="contact-name">
                    {contact.full_name || contact.email.split('@')[0]}
                  </div>
                  <div className="contact-role" style={{ color: getRoleBadgeColor(contact.role) }}>
                    {contact.role}
                  </div>
                </div>
                {selectedContact?.id === contact.id && (
                  <span className="check-mark">✓</span>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>Tidak ada pengguna ditemukan</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={() => setShowNewChat(false)} className="btn btn-secondary">
            Batal
          </button>
          <button 
            onClick={handleStartNewChat} 
            disabled={!selectedContact || sending}
            className="btn btn-primary"
          >
            {sending ? 'Memproses...' : 'Mulai Chat'}
          </button>
        </div>
      </div>
    </div>
  );

  // Main render
  if (isMobileView || isEmbedded) {
    return (
      <div className="messaging-container mobile-mode">
        {showChatView ? renderChatArea() : renderConversationsList()}
        {showNewChat && renderNewChatModal()}
      </div>
    );
  }

  return (
    <div className="messaging-container">
      {renderConversationsList()}
      {selectedConversation ? renderChatArea() : (
        <div className="no-chat-selected">
          <span className="empty-icon">💬</span>
          <h3>Pilih percakapan</h3>
          <p>Pilih percakapan dari daftar atau mulai yang baru</p>
        </div>
      )}
      {showNewChat && renderNewChatModal()}
    </div>
  );
};

// Helper function to format time
function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Kemarin';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

// Export the main component
export default MessagingPage;

// Export for use in other components
export { MessagingPage };
