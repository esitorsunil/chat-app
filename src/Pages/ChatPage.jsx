// src/pages/ChatPage.jsx
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../utils/firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [typingStatus, setTypingStatus] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [userStatuses, setUserStatuses] = useState({});
  const messagesEndRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await updateDoc(doc(db, 'users', user.uid), {
          status: 'online',
          lastActive: serverTimestamp(),
        });
        window.addEventListener('beforeunload', () => {
          updateDoc(doc(db, 'users', user.uid), {
            status: 'offline',
            lastActive: serverTimestamp(),
          });
        });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.uid !== auth.currentUser?.uid);
      setUsers(list);
      const statuses = {};
      list.forEach(u => statuses[u.uid] = u.status || 'offline');
      setUserStatuses(statuses);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data());
      setMessages(msgs);
      scrollToBottom();

      const count = msgs.filter(m =>
        m.timestamp?.toMillis() > (selectedUser.lastSeen || 0) &&
        m.senderId === selectedUser.uid
      ).length;
      setUnreadCounts(prev => ({ ...prev, [selectedUser.uid]: count }));
    });

    const typingRef = doc(db, 'typingStatus', chatId);
    const unsubTyping = onSnapshot(typingRef, snap => {
      const data = snap.data() || {};
      setOtherTyping(data[selectedUser.uid] || false);
    });

    return () => {
      unsubscribe();
      unsubTyping();
      updateDoc(doc(db, 'users', currentUser.uid), { lastSeen: serverTimestamp() });
      setTyping(false);
    };
  }, [selectedUser]);

  const getChatId = (uid1, uid2) => [uid1, uid2].sort().join('_');

  const handleSend = async () => {
    if (!message.trim()) return;
    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      senderId: currentUser.uid,
      text: message,
      timestamp: Timestamp.now(),
    });
    setMessage('');
    setTyping(false);
  };

  const setTyping = (typing) => {
    setTypingStatus(typing);
    if (!selectedUser) return;
    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    setDoc(doc(db, 'typingStatus', chatId), {
      [currentUser.uid]: typing
    }, { merge: true });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLogout = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        status: 'offline',
        lastActive: serverTimestamp(),
      });
      await signOut(auth);
      window.location.href = '/';
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d-flex" style={{ height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ccc' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <img src="/images/logo.png" alt="Logo" height="30" />
          <div className="dropdown">
            <i
              className="bi bi-three-dots-vertical fs-4"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            ></i>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button className="dropdown-item" onClick={() => navigate('/profile')}>Profile</button>
              </li>
              <li>
                <button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          </div>
        </div>
        <div className="p-2">
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filteredUsers.map((user) => (
            <div
              key={user.uid}
              className="d-flex align-items-center mb-3 p-2 rounded hover-bg"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedUser(user)}
            >
              <img
                src={user.imageURL || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
                className="rounded-circle me-2"
                style={{ height: '40px', width: '40px', objectFit: 'cover' }}
                alt="user"
              />
              <div>
                <strong>{user.name}</strong>
                <div className="text-muted small">{user.bio}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-fill d-flex flex-column">
        {selectedUser ? (
          <>
            <div className="d-flex align-items-center border-bottom px-3 py-2 bg-light">
              <img
                src={selectedUser.imageURL || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
                className="rounded-circle me-2"
                style={{ height: '40px', width: '40px', objectFit: 'cover' }}
                alt="chat-user"
              />
              <div>
                <strong>{selectedUser.name}</strong>
                <div className="text-muted small">
                  {otherTyping ? 'Typing...' : userStatuses[selectedUser.uid] === 'online' ? 'Online' : `Last seen ${moment(selectedUser.lastActive?.toDate()).fromNow()}`}
                </div>
              </div>
            </div>
            <div className="flex-fill p-3 overflow-auto" style={{ backgroundColor: '#e9ecef' }}>
              <div className="d-flex flex-column">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`mb-2 p-2 rounded shadow-sm d-inline-block ${
  msg.senderId === currentUser.uid
    ? 'text-dark align-self-end'
    : 'bg-white text-start align-self-start'
}`}
style={
  msg.senderId === currentUser.uid
    ? { backgroundColor: '#dcf8c6' }
    : {}
}
              
                  >
                    <div>{msg.text}</div>
                    <small className="d-block mt-1 text-muted" style={{ fontSize: '0.7rem' }}>
                      {msg.timestamp?.seconds ? moment(msg.timestamp.toDate()).format('LT') : ''}
                    </small>
                  </div>
                ))}
                <div ref={messagesEndRef}></div>
              </div>
            </div>
            <div className="d-flex border-top p-2">
              <input
                className="form-control me-2"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setTyping(!!e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} className="btn btn-success">Send</button>
            </div>
          </>
        ) : (
          <div className="d-flex justify-content-center align-items-center h-100 text-muted">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}