import React from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

export default function Sidebar({
  users,
  search,
  setSearch,
  handleLogout,
  setSelectedUser,
  currentUser,
  unreadCounts = {},
}) {
  const navigate = useNavigate();

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return moment(date).format('h:mm A');
  };

  return (
    <div style={{ width: '300px', backgroundColor: '#fff', borderRight: '1px solid #ccc' }}>
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
        {users.map((user) => {
          const chatId = [currentUser?.uid, user.uid].sort().join('_');
          const localMessages = JSON.parse(localStorage.getItem(chatId) || '[]');
          const lastMessage = localMessages?.slice(-1)[0];
          const isLastFromCurrent = lastMessage?.senderId === currentUser?.uid;
          const previewText = lastMessage
            ? (isLastFromCurrent ? 'You: ' : '') + lastMessage.text
            : user.bio;

          const time = lastMessage?.timestamp
            ? moment(lastMessage.timestamp).format('h:mm A')
            : '';

          const unreadCount = unreadCounts[user.uid] || 0;

          return (
            <div
              key={user.uid}
              className="d-flex justify-content-between align-items-center mb-2 px-2 py-2 rounded hover-bg"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedUser(user)}
            >
              <div className="d-flex align-items-center">
                <img
                  src={user.imageURL || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
                  className="rounded-circle me-2"
                  style={{ height: '45px', width: '45px', objectFit: 'cover' }}
                  alt="user"
                />
                <div className="text-truncate" style={{ maxWidth: '170px' }}>
                  <strong className="d-block">{user.name}</strong>
                  <small className="text-muted text-truncate">{previewText}</small>
                </div>
              </div>
              <div className="text-end">
                <small className="text-muted">{time}</small>
                {unreadCount > 0 && (
                  <span className="badge bg-success rounded-pill ms-1">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
