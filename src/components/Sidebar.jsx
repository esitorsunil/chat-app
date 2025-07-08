import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ users, search, setSearch, handleLogout, setSelectedUser }) {
  const navigate = useNavigate();

  return (
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
        {users.map((user) => (
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
  );
}
