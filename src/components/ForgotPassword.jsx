import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

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
      <h3>איפוס סיסמא</h3>
      <input
        type="email"
        placeholder="הכנס מייל"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={styles.input}
      />
      <div style={styles.buttons}>
        <button onClick={handleReset} style={styles.button}>שלח</button>
        <button onClick={onClose} style={styles.button}>בטל</button>
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
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    minWidth: 300,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    marginBottom: 15,
    padding: 8,
    fontSize: 16,
  },
  buttons: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  button: {
    padding: '8px 16px',
    fontSize: 16,
    cursor: 'pointer',
  }
};
