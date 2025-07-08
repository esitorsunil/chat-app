import { useState, useEffect } from 'react';
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
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import moment from 'moment';

import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';

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
  const [lastMessages, setLastMessages] = useState({});

useEffect(() => {
  if (!currentUser) return;

  const unsub = onSnapshot(collection(db, 'chats'), (snapshot) => {
    const lastMsgs = {};
    snapshot.forEach(async (docSnap) => {
      const chatId = docSnap.id;
      const [uid1, uid2] = chatId.split('_');
      if (![uid1, uid2].includes(currentUser.uid)) return;

      const otherUid = uid1 === currentUser.uid ? uid2 : uid1;
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));
      const msgSnap = await getDocs(q);
      const last = msgSnap.docs[0]?.data();
      if (last) lastMsgs[otherUid] = last;
    });
    setLastMessages(lastMsgs);
  });

  return unsub;
}, [currentUser]);


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
      list.forEach((u) => (statuses[u.uid] = u.status || 'offline'));
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
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      // Mark seen if the latest message is from the other user
      const unseenMessages = msgs.filter(
        (msg) =>
          msg.senderId === selectedUser.uid &&
          msg.status !== 'seen'
      );
      unseenMessages.forEach((msg) => {
        const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
        updateDoc(msgRef, { status: 'seen' });
      });

      const count = unseenMessages.length;
      setUnreadCounts((prev) => ({ ...prev, [selectedUser.uid]: count }));
    });

    const typingRef = doc(db, 'typingStatus', chatId);
    const unsubTyping = onSnapshot(typingRef, (snap) => {
      const data = snap.data() || {};
      setOtherTyping(data[selectedUser.uid] || false);
    });

    return () => {
      unsubscribe();
      unsubTyping();
      updateDoc(doc(db, 'users', currentUser.uid), {
        lastSeen: serverTimestamp(),
      });
      setTyping(false);
    };
  }, [selectedUser]);

  const getChatId = (uid1, uid2) => [uid1, uid2].sort().join('_');

  const storeMessageInLocalStorage = (uid1, uid2, msg) => {
    const chatId = getChatId(uid1, uid2);
    const existing = JSON.parse(localStorage.getItem(chatId) || '[]');
    existing.push({
      senderId: msg.senderId,
      text: msg.text,
      timestamp: Date.now(),
      status: msg.status,
    });
    localStorage.setItem(chatId, JSON.stringify(existing));
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedUser) return;

    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const userMsg = {
      senderId: currentUser.uid,
      text: message,
      timestamp: Timestamp.now(),
      status: 'sent',
    };

    await addDoc(messagesRef, userMsg);
    setMessage('');
    setTyping(false);
    storeMessageInLocalStorage(currentUser.uid, selectedUser.uid, userMsg);

    if (selectedUser.uid === 'openai-bot') {
      getBotReply(message, async (botReply) => {
        const botMsg = {
          senderId: 'openai-bot',
          text: botReply,
          timestamp: Timestamp.now(),
          status: 'seen',
        };
        await addDoc(messagesRef, botMsg);
        storeMessageInLocalStorage(currentUser.uid, 'openai-bot', botMsg);
      });
    }
  };

  const setTyping = (typing) => {
    setTypingStatus(typing);
    if (!selectedUser) return;
    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    setDoc(
      doc(db, 'typingStatus', chatId),
      {
        [currentUser.uid]: typing,
      },
      { merge: true }
    );
  };

  const getBotReply = (userMessage, callback) => {
    const lower = userMessage.toLowerCase();
    const replies = {
      hello: 'Hi there! 👋 How can I help you today?',
      help: 'I can assist you with general questions or guidance.',
      bye: 'Goodbye! 😊 Come back anytime.',
    };
    const botReply = replies[lower] || `You said: "${userMessage}" — I'm still learning! 🤖`;
    setTimeout(() => callback(botReply), 1000);
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

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d-flex" style={{ height: '100vh' }}>
      <Sidebar
  users={filteredUsers}
  search={search}
  setSearch={setSearch}
  handleLogout={handleLogout}
  setSelectedUser={setSelectedUser}
  currentUser={currentUser}
  unreadCounts={unreadCounts}
/>

      <div className="flex-fill d-flex flex-column">
        <ChatBox
          selectedUser={selectedUser}
          messages={messages}
          message={message}
          setMessage={setMessage}
          handleSend={handleSend}
          typing={typingStatus}
          setTyping={setTyping}
          currentUser={currentUser}
          otherTyping={otherTyping}
          userStatuses={userStatuses}
        />
      </div>
    </div>
  );
}