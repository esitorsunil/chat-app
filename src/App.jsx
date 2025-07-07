// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import AuthPage from './Pages/AuthPage';
import ChatPage from './Pages/ChatPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}
