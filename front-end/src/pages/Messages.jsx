import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

function Messages() {
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const socketRef = useRef();
    const chatEndRef = useRef(null);
    const navigate = useNavigate();

    // Load current user
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setCurrentUser(JSON.parse(storedUser));
    }, [navigate]);

    // Fetch all messages and group by conversation
    useEffect(() => {
        if (!currentUser) return;

        const fetchConversations = async () => {
            try {
                const response = await fetch('http://localhost:3100/messages/conversations/' + currentUser._id);
                const data = await response.json();
                setConversations(data);
                setLoading(false);


            } catch (error) {
                console.error('Error fetching conversations:', error);
                setLoading(false);
            }
        };



        fetchConversations();
    }, [currentUser]);

    // Socket connection
    useEffect(() => {
        if (!currentUser) return;

        console.log('🔌 Connecting to messages socket...');
        const socket = io('http://localhost:3100', {
            transports: ['websocket'],
            reconnectionAttempts: 5
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ Connected to messaging server. ID:', socket.id);
        });

        socket.on('receiveMessage', (message) => {
            console.log('📩 New message received:', message);

            const msgSender = String(message.senderId);
            const msgReceiver = String(message.receiverId);
            const myId = String(currentUser._id);
            const selectedId = selectedConversation ? String(selectedConversation.userId) : null;

            // Check if message belongs to the current open chat
            const isForCurrentChat = selectedId && (
                (msgSender === selectedId && msgReceiver === myId) ||
                (msgSender === myId && msgReceiver === selectedId)
            );

            if (isForCurrentChat) {
                console.log('✨ Adding message to current view');
                setMessages(prev => {
                    if (message._id && prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }

            // Always refresh the conversation list to show latest message/new chats
            console.log('🔄 Refreshing conversation list...');
            const fetchConversations = async () => {
                try {
                    const response = await fetch('http://localhost:3100/messages/conversations/' + currentUser._id);
                    const data = await response.json();
                    setConversations(data);
                } catch (error) {
                    console.error('Error refreshing conversations:', error);
                }
            };
            fetchConversations();
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });

        return () => {
            console.log('🧹 Disconnecting messages socket...');
            socket.disconnect();
        };
    }, [currentUser, selectedConversation]);

    // Fetch messages for a specific conversation
    const fetchConversationMessages = async (otherUserId) => {
        if (!currentUser || !otherUserId) return;

        try {
            const response = await fetch(`http://localhost:3100/messages/history/${currentUser._id}/${otherUserId}`);
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Select a conversation
    const selectConversation = async (conversation) => {
        setSelectedConversation(conversation);
        await fetchConversationMessages(conversation.userId);
    };

    // Send message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !currentUser) return;

        const messageData = {
            senderId: currentUser._id,
            receiverId: selectedConversation.userId,
            content: newMessage
        };

        socketRef.current.emit('sendMessage', messageData);
        setNewMessage('');
    };

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) {
        return (
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <h2>Loading messages...</h2>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
            {/* Sidebar - Conversations List */}
            <div style={{ width: '300px', borderRight: '1px solid #ddd', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #ddd', backgroundColor: '#f55e1a', color: 'white' }}>
                    <h2 style={{ margin: 0 }}>Messages</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                        {currentUser?.prenom} {currentUser?.nom}
                    </p>
                </div>

                {conversations.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        <p>No conversations yet</p>
                        <p style={{ fontSize: '12px' }}>Messages will appear here when users contact you</p>
                    </div>
                ) : (
                    conversations.map((conv, idx) => (
                        <div
                            key={idx}
                            onClick={() => selectConversation(conv)}
                            style={{
                                padding: '15px',
                                borderBottom: '1px solid #eee',
                                cursor: 'pointer',
                                backgroundColor: selectedConversation?.userId === conv.userId ? '#e3f2fd' : 'white',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedConversation?.userId === conv.userId ? '#e3f2fd' : 'white'}
                        >
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                {conv.userName}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {conv.lastMessage}
                            </div>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                                {new Date(conv.lastMessageTime).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {!selectedConversation ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h3>Select a conversation</h3>
                            <p>Choose a conversation from the left to start messaging</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '20px', borderBottom: '1px solid #ddd', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{selectedConversation.userName}</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                                    {selectedConversation.userEmail}
                                </p>
                            </div>

                            {(currentUser.role === 'Worker' || currentUser.role === 'Artisan' || currentUser.role === 'Engineer') && (

                                <button
                                    onClick={() => navigate(`/notifications?category=devis&clientId=${selectedConversation.userId}`)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#4e73df',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <i className="icofont-page"></i>
                                    Send Devis
                                </button>
                            )}
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        textAlign: String(msg.senderId) === String(currentUser._id) ? 'right' : 'left',
                                        marginBottom: '15px'
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            padding: '10px 15px',
                                            borderRadius: '15px',
                                            backgroundColor: String(msg.senderId) === String(currentUser._id) ? '#f55e1a' : 'white',
                                            color: String(msg.senderId) === String(currentUser._id) ? 'white' : '#333',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                            maxWidth: '70%',
                                            wordWrap: 'break-word'
                                        }}
                                    >
                                        {msg.content}
                                        <div
                                            style={{
                                                fontSize: '11px',
                                                marginTop: '5px',
                                                opacity: 0.7
                                            }}
                                        >
                                            {new Date(msg.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Message Input */}
                        <form
                            onSubmit={handleSendMessage}
                            style={{
                                padding: '20px',
                                borderTop: '1px solid #ddd',
                                backgroundColor: 'white',
                                display: 'flex',
                                gap: '10px'
                            }}
                        >
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '25px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '12px 30px',
                                    backgroundColor: '#f55e1a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '25px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}
                            >
                                Send
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default Messages;



