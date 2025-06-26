import React, { useEffect, useState } from 'react';
import './MemeGallery.css';

export default function MemeGallery({ user, onEdit }) {
  const [memes, setMemes] = useState([]);

  useEffect(() => {
    if (user) {
      fetch(`https://memegenerator-rr0x.onrender.com/api/${user}/images`)
        .then(res => res.json())
        .then(setMemes);
    }
  }, [user]);

  // For live update after meme creation/edit
  useEffect(() => {
    const handler = () => {
      if (user) {
        const key = `memes-${user}`;
        setMemes(JSON.parse(localStorage.getItem(key) || '[]'));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [user]);

  const handleDownload = (meme) => {
    const a = document.createElement('a');
    a.href = meme.imageUrl;
    a.download = `meme-${meme._id || meme.imageId}.png`;
    a.click();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meme?')) return;
    try {
      await fetch(`https://memegenerator-rr0x.onrender.com/api/memes/${id}`, { method: 'DELETE' });
      setMemes(memes.filter(m => m._id !== id));
    } catch (err) {
      alert('Failed to delete meme');
    }
  };

  return (
    <div className="meme-gallery">
      <h2>Your Meme Gallery</h2>
      <div className="gallery-grid">
        {memes.map(meme => (
          <div className="meme-card" key={meme._id || meme.imageId}>
            <img src={meme.imageUrl} alt="Meme" />
            <div className="meme-text top">{meme.imageDetails?.topText}</div>
            <div className="meme-text bottom">{meme.imageDetails?.bottomText}</div>
            <div className="meme-actions">
              <button onClick={() => handleDownload(meme)}>Download</button>
              <button onClick={() => onEdit && onEdit(meme)}>Edit</button>
              <button onClick={() => handleDelete(meme._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 