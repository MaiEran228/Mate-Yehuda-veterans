import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import LockResetIcon from '@mui/icons-material/LockReset';

function ForgotPassword({ onClose }) {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert('קישור לאיפוס הסיסמא נשלח למייל שלך');
      onClose();
    } catch (error) {
      alert('שגיאה בשליחת האיפוס: ' + error.message);
    }
  };

  return (
    <div style={styles.modalContent}>
      <h3 style={{ display: 'flex', alignItems: 'center', color: 'rgb(105, 148, 179)', fontWeight: 700, fontSize: '2rem', marginBottom: 16 }}>
        <LockResetIcon style={{ fontSize: 32, marginLeft: 8, color: 'rgb(114, 152, 179)' }} />
        איפוס סיסמא
      </h3>
      <input
        type="email"
        placeholder="הכנס מייל"
        borderColor='rgb(82, 106, 109)'
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={styles.input}
      />
      <div style={styles.buttons}>
        <button onClick={onClose} style={{ ...styles.button, background: 'transparent', color: 'rgb(105, 148, 179)', border: '1px solid rgb(114, 152, 179)' }}>בטל</button>
        <button onClick={handleReset} style={styles.button}>שלח</button>
      </div>
    </div>
  );
}

export default function ForgotPasswordModal({ onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={styles.modalWrapper}
        onClick={e => e.stopPropagation()} // עצור את האירוע כדי לא לסגור כשקולטים קליק בתוך החלון
      >
        <ForgotPassword onClose={onClose} />
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalWrapper: {
    background: '#fff',
    borderRadius: 16,
    padding: 36,
    minWidth: 380,
    maxWidth: 480,
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
  },
  input: {
    marginBottom: 15,
    padding: 12,
    fontSize: 18,
    borderRadius: 8,
    border: '1px solid rgb(82, 106, 109)',
    background: '#fff',
    width: '100%',
    boxSizing: 'border-box',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  button: {
    padding: '10px 28px',
    fontSize: 17,
    cursor: 'pointer',
    borderRadius: 6,
    border: 'none',
    background: 'rgb(114, 152, 179)',
    color: '#fff',
    fontWeight: 600,
    transition: 'background 0.2s',
  }
};