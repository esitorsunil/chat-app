// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../utils/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setName(data.name ?? '');
          setBio(data.bio ?? '');
          setImagePreview(data.imageURL || null);
        }
      } catch (err) {
        console.error('⚠️ Failed to fetch user profile:', err);
      }
    };

    fetchUserData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result ?? null);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    let imageURL = imagePreview ?? '';

    try {
      if (imageFile) {
        const storageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(storageRef, imageFile);
        imageURL = await getDownloadURL(storageRef);
      }

      const userData = {
        uid: user.uid,
        email: user.email,
        name,
        bio,
        imageURL,
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, userData);

      toast.success('Profile saved!');
      setTimeout(() => navigate('/chat'), 1000);
    } catch (err) {
      console.error('❌ Error saving profile:', err);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid py-5 min-vh-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundImage:
          'url("https://logincdn.msauth.net/shared/5/images/fluent_web_light_57fee22710b04cebe1d5.svg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <ToastContainer />
      <div
        className="card shadow d-flex flex-row overflow-hidden"
        style={{ maxWidth: '900px', width: '100%', minHeight: '450px' }}
      >
        {/* Left: Form Section */}
        <div className="p-4 flex-fill" style={{ flex: 1.5 }}>
          <h3 className="mb-4 text-center">Complete Your Profile</h3>
          <form onSubmit={handleSaveProfile}>
            <div className="mb-3">
              <label className="form-label">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={handleImageChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your name"
                value={name ?? ''}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Bio</label>
              <textarea
                className="form-control"
                placeholder="Write a short bio"
                rows="3"
                value={bio ?? ''}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save & Continue to Chat'}
            </button>
          </form>
        </div>

        {/* Right: Preview Section */}
        <div
          className="d-none d-md-flex justify-content-center align-items-center"
          style={{
            flex: 1,
            backgroundColor: 'rgba(248, 249, 250, 0.7)',
          }}
        >
          <div className="text-center">
            <div
              className="rounded-circle mx-auto"
              style={{
                height: '150px',
                width: '150px',
                backgroundColor: '#fff',
                overflow: 'hidden',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="img-fluid h-100 w-100"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <img
                  src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
                  alt="Default Profile"
                  className="img-fluid h-100 w-100"
                  style={{ objectFit: 'cover' }}
                />
              )}
            </div>
            <p className="mt-3 fw-semibold">{name || 'Your Name'}</p>
            <small className="text-muted">
              {bio || 'Your short bio will appear here'}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
