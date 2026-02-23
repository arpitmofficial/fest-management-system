import { useState, useEffect, useCallback, useContext } from 'react';
import api from '../api';
import AuthContext from '../context/AuthContext';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🤔', '👎'];

const EventDiscussion = ({ eventId }) => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [pinned, setPinned] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [replies, setReplies] = useState({});
    const [showReplies, setShowReplies] = useState({});
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);

    const fetchMessages = useCallback(async (p = 1) => {
        try {
            const { data } = await api.get(`/discussions/${eventId}?page=${p}`);
            setPinned(data.pinned);
            if (p === 1) setMessages(data.messages);
            else setMessages(prev => [...prev, ...data.messages]);
            setPagination(data.pagination);
            setIsOrganizer(data.isOrganizer);
            setError('');
        } catch (err) {
            if (err.response?.status === 403) setError('Register for this event to join the discussion.');
            else setError('Could not load discussion.');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(() => fetchMessages(), 8000); // Poll for new messages
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await api.post(`/discussions/${eventId}`, {
                content: newMessage,
                parentMessage: replyTo,
                isAnnouncement
            });
            setNewMessage('');
            setReplyTo(null);
            setIsAnnouncement(false);
            fetchMessages();
            if (replyTo) loadReplies(replyTo);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post message');
        }
    };

    const handleDelete = async (msgId) => {
        if (!confirm('Delete this message?')) return;
        try {
            await api.delete(`/discussions/${eventId}/${msgId}`);
            fetchMessages();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handlePin = async (msgId) => {
        try {
            await api.put(`/discussions/${eventId}/${msgId}/pin`);
            fetchMessages();
        } catch (err) {
            console.error('Pin failed:', err);
        }
    };

    const handleReact = async (msgId, emoji) => {
        try {
            await api.put(`/discussions/${eventId}/${msgId}/react`, { emoji });
            setShowEmojiPicker(null);
            fetchMessages();
        } catch (err) {
            console.error('React failed:', err);
        }
    };

    const loadReplies = async (msgId) => {
        try {
            const { data } = await api.get(`/discussions/${eventId}/replies/${msgId}`);
            setReplies(prev => ({ ...prev, [msgId]: data }));
            setShowReplies(prev => ({ ...prev, [msgId]: true }));
        } catch (err) {
            console.error('Load replies failed:', err);
        }
    };

    const toggleReplies = (msgId) => {
        if (showReplies[msgId]) {
            setShowReplies(prev => ({ ...prev, [msgId]: false }));
        } else {
            loadReplies(msgId);
        }
    };

    const getReactionCounts = (reactions) => {
        const counts = {};
        reactions?.forEach(r => {
            counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        });
        return counts;
    };

    const hasUserReacted = (reactions, emoji) => {
        return reactions?.some(r => r.user === user?._id && r.emoji === emoji);
    };

    const MessageCard = ({ msg, isReply = false }) => {
        const reactionCounts = getReactionCounts(msg.reactions);
        const isAuthor = msg.author === user?._id;

        return (
            <div style={{
                padding: isReply ? '10px 12px' : '12px 15px',
                marginBottom: isReply ? '6px' : '10px',
                border: msg.isAnnouncement ? '2px solid #1565c0' : '1px solid #eee',
                borderRadius: '4px',
                backgroundColor: msg.isAnnouncement ? '#e3f2fd' : msg.isPinned ? '#fff8e1' : '#fff',
                marginLeft: isReply ? '30px' : 0
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>{msg.authorName}</span>
                        {msg.authorModel === 'Organizer' && (
                            <span style={{ fontSize: '11px', color: '#1565c0', marginLeft: '6px', padding: '1px 5px', backgroundColor: '#e3f2fd', borderRadius: '3px' }}>Organizer</span>
                        )}
                        {msg.isAnnouncement && (
                            <span style={{ fontSize: '11px', color: '#fff', marginLeft: '6px', padding: '1px 5px', backgroundColor: '#1565c0', borderRadius: '3px' }}>📢 Announcement</span>
                        )}
                        {msg.isPinned && (
                            <span style={{ fontSize: '11px', color: '#ef6c00', marginLeft: '6px' }}>📌 Pinned</span>
                        )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#888' }}>{new Date(msg.createdAt).toLocaleString()}</span>
                </div>

                <p style={{ margin: '0 0 8px 0', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</p>

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Reactions */}
                    {Object.entries(reactionCounts).map(([emoji, count]) => (
                        <button key={emoji} onClick={() => handleReact(msg._id, emoji)} style={{
                            padding: '2px 6px', border: '1px solid #ddd', borderRadius: '12px', fontSize: '12px',
                            backgroundColor: hasUserReacted(msg.reactions, emoji) ? '#e3f2fd' : '#f5f5f5',
                            cursor: 'pointer'
                        }}>
                            {emoji} {count}
                        </button>
                    ))}

                    {/* Add Reaction */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)} style={{
                            padding: '2px 6px', border: '1px solid #ddd', borderRadius: '12px', fontSize: '12px', backgroundColor: '#f5f5f5', cursor: 'pointer'
                        }}>+</button>
                        {showEmojiPicker === msg._id && (
                            <div style={{ position: 'absolute', bottom: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', padding: '4px', display: 'flex', gap: '2px', zIndex: 10 }}>
                                {EMOJIS.map(e => (
                                    <button key={e} onClick={() => handleReact(msg._id, e)} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', padding: '2px' }}>{e}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reply */}
                    {!isReply && (
                        <button onClick={() => setReplyTo(replyTo === msg._id ? null : msg._id)} style={{
                            fontSize: '12px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'
                        }}>Reply</button>
                    )}

                    {/* Thread toggle */}
                    {!isReply && (
                        <button onClick={() => toggleReplies(msg._id)} style={{
                            fontSize: '12px', color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer'
                        }}>💬 Replies</button>
                    )}

                    {/* Organizer actions */}
                    {isOrganizer && (
                        <>
                            <button onClick={() => handlePin(msg._id)} style={{ fontSize: '12px', color: '#ef6c00', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {msg.isPinned ? 'Unpin' : '📌 Pin'}
                            </button>
                            <button onClick={() => handleDelete(msg._id)} style={{ fontSize: '12px', color: '#c62828', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                        </>
                    )}

                    {/* Own message delete */}
                    {isAuthor && !isOrganizer && (
                        <button onClick={() => handleDelete(msg._id)} style={{ fontSize: '12px', color: '#c62828', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    )}
                </div>

                {/* Reply input */}
                {replyTo === msg._id && (
                    <form onSubmit={handlePost} style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Write a reply..."
                            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                            autoFocus
                        />
                        <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Reply</button>
                    </form>
                )}

                {/* Replies */}
                {showReplies[msg._id] && replies[msg._id] && (
                    <div style={{ marginTop: '10px' }}>
                        {replies[msg._id].length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#888', marginLeft: '30px' }}>No replies yet.</p>
                        ) : (
                            replies[msg._id].map(reply => <MessageCard key={reply._id} msg={reply} isReply />)
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading discussion...</div>;
    if (error) return <div style={{ padding: '20px', textAlign: 'center', color: '#c62828' }}>{error}</div>;

    return (
        <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>💬 Discussion Forum</h3>

            {/* Post new message */}
            {!replyTo && (
                <form onSubmit={handlePost} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Write a message..."
                            style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        />
                        <button type="submit" style={{ padding: '10px 18px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Post</button>
                    </div>
                    {isOrganizer && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '13px', color: '#666' }}>
                            <input type="checkbox" checked={isAnnouncement} onChange={(e) => setIsAnnouncement(e.target.checked)} />
                            Post as announcement
                        </label>
                    )}
                </form>
            )}

            {/* Pinned Messages */}
            {pinned.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#ef6c00', marginBottom: '8px' }}>📌 Pinned Messages</p>
                    {pinned.map(msg => <MessageCard key={msg._id} msg={msg} />)}
                </div>
            )}

            {/* Messages */}
            {messages.length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No messages yet. Be the first to start the discussion!</p>
            ) : (
                messages.map(msg => <MessageCard key={msg._id} msg={msg} />)
            )}

            {/* Load More */}
            {pagination && page < pagination.pages && (
                <button onClick={() => { setPage(p => p + 1); fetchMessages(page + 1); }} style={{
                    display: 'block', margin: '15px auto', padding: '8px 20px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px'
                }}>Load More</button>
            )}
        </div>
    );
};

export default EventDiscussion;
