import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, db } from '../utils/firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      let userCredential;

      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        toast.success('Login successful!');
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Registration successful!');
      }

      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      // Delay for toast message
      setTimeout(() => {
        if (userSnapshot.exists()) {
          navigate('/chat');
        } else {
          navigate('/profile');
        }
      }, 1000);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center min-vh-100"
      style={{ backgroundColor: '#fcf5eb' }}
    >
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Logo */}
      <div className="position-absolute top-0 start-0 m-3">
        <a href="/">
          <img
            src="/images/logo.png"
            alt="ICQ Logo"
            style={{ height: '40px', width: 'auto', cursor: 'pointer' }}
          />
        </a>
      </div>

      {/* Auth Card */}
      <div className="card p-4 shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <label className="form-label">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="showPasswordCheck"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <label className="form-check-label" htmlFor="showPasswordCheck">
              Show Password
            </label>
          </div>

          {err && (
            <div className="alert alert-danger text-center py-2">{err}</div>
          )}

          <button
            className="btn btn-success w-100 mt-2"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <div className="d-flex align-items-center justify-content-center">
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {isLogin ? 'Logging in...' : 'Registering...'}
              </div>
            ) : (
              isLogin ? 'Login' : 'Register'
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <small className="text-muted">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </small>
        </div>
      </div>
    </div>
  );
}
