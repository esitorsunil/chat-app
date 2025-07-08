// ChatBox.jsx (with Jitsi Meet Integration in Modal)
import React, { useRef, useEffect, useState } from 'react';
import moment from 'moment';
import {
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function ChatBox({
  selectedUser,
  messages,
  message,
  setMessage,
  handleSend,
  typing,
  setTyping,
  currentUser,
  otherTyping,
  userStatuses,
}) {
  const messagesEndRef = useRef();
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showJitsi, setShowJitsi] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  const getChatId = (uid1, uid2) => [uid1, uid2].sort().join('_');

  const handleEdit = (msg) => {
    setEditId(msg.id);
    setEditText(msg.text);
  };

  const saveEdit = async () => {
    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    const messageRef = doc(db, 'chats', chatId, 'messages', editId);
    await updateDoc(messageRef, { text: editText });
    setEditId(null);
    setEditText('');
  };

  const handleDelete = async (msgId) => {
    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    const messageRef = doc(db, 'chats', chatId, 'messages', msgId);
    await deleteDoc(messageRef);
  };

  const isToday = (date) => moment().isSame(moment(date), 'day');
  const isYesterday = (date) => moment().subtract(1, 'days').isSame(moment(date), 'day');

  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = msg.timestamp?.toDate
      ? moment(msg.timestamp.toDate()).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  if (!selectedUser) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100 text-muted">
        Select a user to start chatting
      </div>
    );
  }

  return (
    <>
      <div className="d-flex align-items-center border-bottom px-3 py-2 bg-light justify-content-between">
        <div className="d-flex align-items-center">
          <img
            src={selectedUser.imageURL || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
            className="rounded-circle me-2"
            style={{ height: '40px', width: '40px', objectFit: 'cover' }}
            alt="chat-user"
          />
          <div>
            <strong>{selectedUser.name}</strong>
            <div className="text-muted small">
              {otherTyping
                ? 'Typing...'
                : userStatuses[selectedUser.uid] === 'online'
                ? 'Online'
                : `Last seen ${moment(selectedUser.lastActive?.toDate()).fromNow()}`}
            </div>
          </div>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={() => setShowJitsi(true)}>
          <i className="bi bi-camera-video"></i> Call
        </button>
      </div>

      <div className="flex-fill p-3 overflow-auto" style={{ backgroundColor: '#e9ecef' }}>
        <div className="d-flex flex-column">
          {Object.keys(groupedMessages).map((dateKey, idx) => {
            const date = moment(dateKey);
            const label = isToday(date)
              ? 'Today'
              : isYesterday(date)
              ? 'Yesterday'
              : date.format('D MMM YYYY');

            return (
              <div key={idx}>
                <div className="text-center my-3">
                  <span
                    className="px-3 py-1 rounded text-muted small"
                    style={{ background: '#d3d3d3', fontSize: '0.75rem' }}
                  >
                    {label}
                  </span>
                </div>

                {groupedMessages[dateKey].map((msg, i) => {
                  const isOwn = msg.senderId === currentUser.uid;

                  return (
                    <div
                      key={i}
                      className={`mb-2 d-flex ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div
                        className={`position-relative p-2 rounded shadow-sm d-inline-block text-wrap ${
                          isOwn ? 'text-dark' : 'bg-white text-start'
                        }`}
                        style={
                          isOwn
                            ? { backgroundColor: '#dcf8c6', maxWidth: '75%' }
                            : { maxWidth: '75%' }
                        }
                      >
                        {editId === msg.id ? (
                          <>
                            <input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="form-control mb-1"
                            />
                            <div className="d-flex gap-2 justify-content-end">
                              <button onClick={saveEdit} className="btn btn-sm btn-primary">
                                Save
                              </button>
                              <button onClick={() => setEditId(null)} className="btn btn-sm btn-secondary">
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="d-flex align-items-start justify-content-between gap-2 message-wrapper">
                              <div>{msg.text}</div>
                              {isOwn && (
                                <div className="dropdown menu-icon">
                                  <i
                                    className="bi bi-three-dots-vertical text-muted"
                                    style={{ cursor: 'pointer', fontSize: '1rem' }}
                                    data-bs-toggle="dropdown"
                                  ></i>
                                  <ul className="dropdown-menu">
                                    <li>
                                      <button className="dropdown-item" onClick={() => handleEdit(msg)}>
                                        Edit
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        className="dropdown-item text-danger"
                                        onClick={() => handleDelete(msg.id)}
                                      >
                                        Delete
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="d-flex justify-content-end align-items-center gap-1 mt-1">
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {msg.timestamp?.seconds ? moment(msg.timestamp.toDate()).format('LT') : ''}
                              </small>
                              {isOwn && (
                                <i
                                  className={`bi ${
                                    msg.status === 'seen'
                                      ? 'bi-check-all text-primary'
                                      : 'bi-check text-muted'
                                  }`}
                                  style={{ fontSize: '1rem' }}
                                ></i>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
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
        <button onClick={handleSend} className="btn btn-success">
          Send
        </button>
      </div>

      {showJitsi && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded shadow p-2 position-relative" style={{ width: '90%', height: '80%' }}>
            <button
              className="btn btn-danger position-absolute top-0 end-0 m-2"
              onClick={() => setShowJitsi(false)}
            >
              Close
            </button>
            <iframe
              src={`https://meet.jit.si/${getChatId(currentUser.uid, selectedUser.uid)}`}
              allow="camera; microphone; fullscreen; display-capture"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Video Call"
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
}
