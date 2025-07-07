// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import AuthPage from './Pages/AuthPage';
import ChatPage from './Pages/ChatPage';
import ProfilePage from './Pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}
