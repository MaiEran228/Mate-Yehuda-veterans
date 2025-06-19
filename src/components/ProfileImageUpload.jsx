import { Typography } from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export default function ProfileImageUpload({ imageUrl, onImageChange, disabled }) {
  const [imagePreview, setImagePreview] = useState(imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      const uniqueFileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `profile-images/${uniqueFileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      onImageChange(downloadURL);
      setIsUploading(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', marginBottom: 16 }}>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="profile-image-upload"
        type="file"
        onChange={handleImageUpload}
        disabled={disabled}
      />
      <label htmlFor="profile-image-upload">
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: '#f5f5f5',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            opacity: disabled ? 1 : undefined,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => !disabled && (e.target.style.opacity = '0.8')}
          onMouseLeave={(e) => !disabled && (e.target.style.opacity = '1')}
        >
          {(imagePreview || imageUrl) ? (
            <img 
              src={imagePreview || imageUrl} 
              alt="תמונת פרופיל" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <AddPhotoAlternateIcon sx={{ fontSize: 40, color: '#999' }} />
          )}
        </div>
      </label>
      {isUploading && (
        <Typography variant="body2" color="text.secondary">
          מעלה תמונה...
        </Typography>
      )}
      {!imagePreview && !isUploading && !imageUrl && (
        <Typography variant="body2" color="text.secondary">
          העלאת תמונת פרופיל
        </Typography>
      )}
    </div>
  );
}