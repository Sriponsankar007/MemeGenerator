import React, { useState, useRef, useEffect } from 'react';
import './MemeGenerator.css';

const fonts = ['Impact', 'Arial', 'Comic Sans MS', 'Times New Roman', 'Verdana'];

export default function MemeGenerator({ user, editingMeme, onEditDone }) {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [fontFamily, setFontFamily] = useState('Impact');
  const [fontSize, setFontSize] = useState(40);
  const [color, setColor] = useState('#fff');
  const [outline, setOutline] = useState('#000');
  const canvasRef = useRef();

  // Load meme for editing
  useEffect(() => {
    if (editingMeme) {
      setImage(editingMeme.image);
      setTopText(editingMeme.topText);
      setBottomText(editingMeme.bottomText);
      setFontFamily(editingMeme.fontFamily);
      setFontSize(editingMeme.fontSize || 40);
      setColor(editingMeme.topColor || '#fff');
      setOutline(editingMeme.outline || '#000');
    }
  }, [editingMeme]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const drawMeme = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = outline;
      ctx.fillStyle = color;
      // Top text
      ctx.strokeText(topText, canvas.width / 2, fontSize + 10);
      ctx.fillText(topText, canvas.width / 2, fontSize + 10);
      // Bottom text
      ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 20);
      ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20);
    };
  };

  useEffect(() => {
    if (image) drawMeme();
    // eslint-disable-next-line
  }, [image, topText, bottomText, fontFamily, fontSize, color, outline]);

  const handleGenerate = async () => {
    if (!image) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const meme = {
      image: dataUrl,
      topText,
      bottomText,
      fontFamily,
      fontSize,
      topColor: color,
      outline,
      user,
      createdAt: new Date().toISOString(),
    };
    // Save to backend
    const res = await fetch(`https://memegenerator-rr0x.onrender.com/api/${user}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: dataUrl,
        imageId: Date.now().toString(), // or another unique ID
        imageDetails: {
          topText,
          bottomText,
          fontFamily,
          fontSize,
          topColor: color,
          outline,
          createdAt: new Date().toISOString(),
        }
      }),
    });
    if (res.ok) {
      console.log('Meme saved in MongoDB');
      if (onEditDone) onEditDone();
      // Clear form
      setImage(null);
      setImageFile(null);
      setTopText('');
      setBottomText('');
      setFontFamily('Impact');
      setFontSize(40);
      setColor('#fff');
      setOutline('#000');
    } else {
      alert('Failed to save meme');
    }
  };

  return (
    <div className="meme-generator">
      <h2>{editingMeme ? 'Edit Meme' : 'Create a Meme'}</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <div className="controls">
        <input value={topText} onChange={e => setTopText(e.target.value)} placeholder="Top text" />
        <input value={bottomText} onChange={e => setBottomText(e.target.value)} placeholder="Bottom text" />
        <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
          {fonts.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} title="Text Color" />
        <input type="color" value={outline} onChange={e => setOutline(e.target.value)} title="Outline Color" />
        <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} min={10} max={100} />
      </div>
      <button onClick={handleGenerate} disabled={!image}>{editingMeme ? 'Save Changes' : 'Generate Meme'}</button>
      <div className="preview">
        <canvas ref={canvasRef} style={{ maxWidth: '100%', border: '1px solid #ccc', marginTop: 16 }} />
      </div>
    </div>
  );
} 