import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

// Messaging Module
export const MessagingModule = () => {
  const { user } = useAuth();
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

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get conversations where user is participant
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id),
          messages(count)
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get other participant info
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id, profiles(email)')
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id);

          return {
            ...conv,
            last_message: lastMsg,
            other_participant: participants?.[0]?.profiles?.email || 'Unknown'
          };
        })
      );

      setConversations(conversationsWithLastMessage);
    } catch (err) {
      setError('Gagal memuat percakapan: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch contacts (other users)
  const fetchContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .neq('id', user?.id)
        .limit(50);

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err.message);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, [fetchConversations, fetchContacts]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (selectedConversation?.id === payload.new.conversation_id) {
            setMessages(prev => [...prev, payload.new]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation, fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(email)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      setError('Gagal memuat pesan: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      setNewMessage('');
      fetchMessages(selectedConversation.id);
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

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (existingConv?.length > 0) {
        const convIds = existingConv.map(c => c.conversation_id);
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', selectedContact.id)
          .in('conversation_id', convIds);

        if (otherParticipant?.length > 0) {
          const existing = conversations.find(
            c => c.id === otherParticipant[0].conversation_id
          );
          if (existing) {
            setSelectedConversation(existing);
            setShowNewChat(false);
            setSending(false);
            return;
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: selectedContact.id }
      ]);

      setSelectedConversation(newConv);
      setMessages([]);
      setShowNewChat(false);
      fetchConversations();
    } catch (err) {
      setError('Gagal memulai percakapan: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messaging-container">
      <div className="conversations-sidebar">
        <div className="sidebar-header">
          <h2>Pesan</h2>
          <button 
            onClick={() => setShowNewChat(true)}
            className="btn btn-primary btn-sm"
          >
            +
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && !selectedConversation ? (
          <div className="loading-container">
            <div className="spinner spinner-small"></div>
          </div>
        ) : conversations.length > 0 ? (
          <div className="conversations-list">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                onClick={() => handleSelectConversation(conv)}
              >
                <div className="conversation-avatar">
                  {conv.other_participant?.charAt(0).toUpperCase()}
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">{conv.other_participant}</div>
                  <div className="conversation-preview">
                    {conv.last_message?.content || 'Belum ada pesan'}
                  </div>
                </div>
                <div className="conversation-time">
                  {conv.last_message 
                    ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
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
              style={{ marginTop: '1rem' }}
            >
              Mulai Percakapan
            </button>
          </div>
        )}
      </div>

      <div className="chat-area">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-avatar">
                {selectedConversation.other_participant?.charAt(0).toUpperCase()}
              </div>
              <div className="chat-name">{selectedConversation.other_participant}</div>
            </div>

            <div className="messages-container">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
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
                className="btn btn-primary"
              >
                {sending ? '...' : 'Kirim'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <span className="empty-icon">💬</span>
            <p>Pilih percakapan untuk mulai chat</p>
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal
          contacts={contacts}
          selectedContact={selectedContact}
          setSelectedContact={setSelectedContact}
          onStartChat={handleStartNewChat}
          onClose={() => setShowNewChat(false)}
          loading={sending}
        />
      )}
    </div>
  );
};

// New Chat Modal
const NewChatModal = ({ contacts, selectedContact, setSelectedContact, onStartChat, onClose, loading }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Percakapan Baru</h2>
        <button onClick={onClose} className="modal-close">&times;</button>
      </div>

      <div className="contacts-list">
        {contacts.length > 0 ? (
          contacts.map(contact => (
            <div
              key={contact.id}
              className={`contact-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="contact-avatar">
                {contact.email.charAt(0).toUpperCase()}
              </div>
              <div className="contact-info">
                <div className="contact-email">{contact.email}</div>
                <div className="contact-role">{contact.role}</div>
              </div>
              {selectedContact?.id === contact.id && <span className="check-mark">✓</span>}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Tidak ada kontak tersedia</p>
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button onClick={onClose} className="btn btn-secondary">
          Batal
        </button>
        <button 
          onClick={onStartChat} 
          disabled={!selectedContact || loading}
          className="btn btn-primary"
        >
          {loading ? 'Memproses...' : 'Mulai Chat'}
        </button>
      </div>
    </div>
  </div>
);

export default MessagingModule;
