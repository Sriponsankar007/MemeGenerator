import React, { useState, useEffect } from 'react';
import MemeGenerator from './MemeGenerator';
import MemeGallery from './MemeGallery';
import Login from './Login';
import './MemeGenerator.css';
import './MemeGallery.css';
import './Login.css';

function App() {
  const [user, setUser] = useState(null);
  const [editingMeme, setEditingMeme] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('meme-username');
    if (saved) setUser(saved);
  }, []);

  const handleLogin = (username) => setUser(username);
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('meme-username');
  };
  const handleEdit = (meme) => {
    setEditingMeme(meme);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleEditDone = () => setEditingMeme(null);

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',padding:'16px 32px 0 0'}}>
        <span style={{marginRight:16,fontWeight:600,color:'#1976d2'}}>Hi, {user}</span>
        <button onClick={handleLogout} style={{background:'#fff',border:'1.5px solid #1976d2',color:'#1976d2',borderRadius:6,padding:'6px 18px',fontWeight:600,cursor:'pointer'}}>Logout</button>
      </div>
      <MemeGenerator user={user} editingMeme={editingMeme} onEditDone={handleEditDone} />
      <MemeGallery user={user} onEdit={handleEdit} />
    </div>
  );
}

export default App;
