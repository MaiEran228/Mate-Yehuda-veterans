import {
  TextField, MenuItem, Checkbox, FormControlLabel, Typography, Box, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, FormControl,
} from "@mui/material";
import { useState } from "react";
import { findMatchingTransports, addPassengerToTransport, getPassengerTransport, removePassengerFromTransports } from '../../utils/transportUtils';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import CustomDialog from '../CustomDialog';
import EditProfileFields from './EditProfileFields';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const GENDERS = ["זכר", "נקבה", "אחר"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

function EditProfileWindow({ profile: initialProfile, handleChange, handleDayChange, handleCancelEdit, handleSave }) {
  const [transportDialog, setTransportDialog] = useState({ open: false, transports: [] });
  const [loading, setLoading] = useState(false);
  const [originalTransportData, setOriginalTransportData] = useState({
    city: initialProfile.city,
    transport: initialProfile.transport,
    arrivalDays: initialProfile.arrivalDays,
    hasCaregiver: initialProfile.hasCaregiver
  });
  const [successDialog, setSuccessDialog] = useState({ open: false, message: '' });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(initialProfile.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [noTransportDialogOpen, setNoTransportDialogOpen] = useState(false);
  const [assignDialog, setAssignDialog] = useState({ open: false, message: '', type: 'info' });
  const navigate = useNavigate();

  const arrivalDaysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
  const sortedArrivalDays = (initialProfile.arrivalDays || []).slice().sort((a, b) => arrivalDaysOrder.indexOf(a) - arrivalDaysOrder.indexOf(b));

  // בודק אם השדות הרלוונטיים להסעה השתנו
  const hasTransportFieldsChanged = () => {
    // השוואה מדויקת יותר של מערכי ימי הגעה
    const currentDaysSorted = (initialProfile.arrivalDays || []).slice().sort();
    const originalDaysSorted = (originalTransportData.arrivalDays || []).slice().sort();

    return (
      initialProfile.city !== originalTransportData.city ||
      initialProfile.transport !== originalTransportData.transport ||
      initialProfile.hasCaregiver !== originalTransportData.hasCaregiver ||
      JSON.stringify(currentDaysSorted) !== JSON.stringify(originalDaysSorted)
    );
  };

  const isValidPhoneNumber = (phone) => {
    if (!phone) return true; // אם השדה ריק, נטפל בזה בנפרד
    if (!/^\d+$/.test(phone)) {
      return false;
    }

    const landlinePrefixes = ["02", "03", "04", "08", "09"];
    const mobilePrefixes = [
      "050", "051", "052", "053", "054", "055", "056", "057", "058", "059",
      "072", "073", "074", "075", "076", "077", "078"
    ];

    if (phone.length === 9) {
      return landlinePrefixes.includes(phone.slice(0, 2));
    } else if (phone.length === 10) {
      return mobilePrefixes.includes(phone.slice(0, 3));
    }

    return false;
  };

  const isValidIsraeliID = (id) => {
    // בדיקה שהקלט מכיל רק ספרות ובאורך 9
    if (!/^\d{9}$/.test(id)) {
      return false;
    }
    return true;
  };

  const handleAssignTransport = async () => {
    setLoading(true);
    try {
      if (initialProfile.transport === "פרטי") {
        await removePassengerFromTransports(initialProfile.id);
        setSuccessDialog({ open: true, message: "דרך ההגעה השתנתה לפרטי" });
        setOriginalTransportData({
          city: initialProfile.city,
          transport: initialProfile.transport,
          arrivalDays: initialProfile.arrivalDays,
          hasCaregiver: initialProfile.hasCaregiver
        });
        setLoading(false);
        return;
      }

      // וידוא שיש את כל הנתונים הנדרשים
      if (!initialProfile.arrivalDays || initialProfile.arrivalDays.length === 0) {
        setSuccessDialog({ open: true, message: "נא לבחור ימי הגעה לפני עדכון הסעה" });
        setLoading(false);
        return;
      }
      if (!initialProfile.city) {
        setSuccessDialog({ open: true, message: "נא למלא יישוב לפני עדכון הסעה" });
        setLoading(false);
        return;
      }

      // בדוק אם הנוסע כבר משובץ להסעה
      const currentTransport = await getPassengerTransport(initialProfile.id);
      const allDaysIncluded = currentTransport && initialProfile.arrivalDays.every(day => currentTransport.days.includes(day)) && currentTransport.type === initialProfile.transport && currentTransport.cities.includes(initialProfile.city);
      if (currentTransport && allDaysIncluded) {
        // עדכן את arrivalDays של הנוסע בתוך ההסעה הקיימת
        const updatedPassengers = (currentTransport.passengers || []).map(p =>
          p.id === initialProfile.id ? { ...p, arrivalDays: initialProfile.arrivalDays, hasCaregiver: initialProfile.hasCaregiver } : p
        );
        await addPassengerToTransport(currentTransport.id, {
          id: initialProfile.id,
          name: initialProfile.name,
          phone: initialProfile.phone,
          city: initialProfile.city,
          hasCaregiver: initialProfile.hasCaregiver || false,
          arrivalDays: initialProfile.arrivalDays || []
        });
        setSuccessDialog({
          open: true,
          message: `${initialProfile.name} עודכן להסעה מספר ${currentTransport.serialNumber} - ${currentTransport.cities.join(' -> ')} (ימים: ${initialProfile.arrivalDays.join(', ')})`
        });
        setOriginalTransportData({
          city: initialProfile.city,
          transport: initialProfile.transport,
          arrivalDays: initialProfile.arrivalDays,
          hasCaregiver: initialProfile.hasCaregiver
        });
        setLoading(false);
        return;
      }

      // אם אין הסעה קיימת מתאימה, המשך עם הלוגיקה הרגילה
      await removePassengerFromTransports(initialProfile.id);
      let attempts = 0;
      const maxAttempts = 5;
      let checkTransport = null;
      do {
        await new Promise(resolve => setTimeout(resolve, 500));
        checkTransport = await getPassengerTransport(initialProfile.id);
        attempts++;
      } while (checkTransport && attempts < maxAttempts);

      const matchingTransports = await findMatchingTransports(
        initialProfile.arrivalDays || [],
        initialProfile.city,
        initialProfile.transport,
        initialProfile.hasCaregiver || false,
        initialProfile.id
      );

      if (matchingTransports.length === 0) {
        setNoTransportDialogOpen(true);
      } else if (matchingTransports.length === 1) {
        await addPassengerToTransport(matchingTransports[0].id, {
          id: initialProfile.id,
          name: initialProfile.name,
          phone: initialProfile.phone,
          city: initialProfile.city,
          hasCaregiver: initialProfile.hasCaregiver || false,
          arrivalDays: initialProfile.arrivalDays || []
        });
        setSuccessDialog({
          open: true,
          message: `${initialProfile.name} שובץ להסעה מספר ${matchingTransports[0].serialNumber} - ${matchingTransports[0].cities.join(' -> ')} (ימים: ${initialProfile.arrivalDays.join(', ')})`
        });
        setOriginalTransportData({
          city: initialProfile.city,
          transport: initialProfile.transport,
          arrivalDays: initialProfile.arrivalDays,
          hasCaregiver: initialProfile.hasCaregiver
        });
      } else {
        setTransportDialog({ open: true, transports: matchingTransports });
      }
    } catch (error) {
      console.error('Error assigning transport:', error);
      setSuccessDialog({ open: true, message: 'אירעה שגיאה בשיבוץ להסעה: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTransportSelect = async (transport) => {
    try {
      console.log('Selecting transport:', transport.serialNumber); // לוג לדיבוג

      // קודם מסיר את הנוסע מההסעה הקודמת (וידוא כפול)
      await removePassengerFromTransports(initialProfile.id);

      // המתנה קצרה
      await new Promise(resolve => setTimeout(resolve, 300));

      await addPassengerToTransport(transport.id, {
        id: initialProfile.id,
        name: initialProfile.name,
        phone: initialProfile.phone,
        city: initialProfile.city,
        hasCaregiver: initialProfile.hasCaregiver || false,
        arrivalDays: initialProfile.arrivalDays || []
      });

      setAssignDialog({
        open: true,
        message: `${initialProfile.name} שובץ להסעה מספר ${transport.serialNumber} - ${transport.cities.join(' -> ')}`,
        type: 'success'
      });
      setTransportDialog({ open: false, transports: [] });

      // עדכון הנתונים המקוריים לאחר שיבוץ מוצלח
      setOriginalTransportData({
        city: initialProfile.city,
        transport: initialProfile.transport,
        arrivalDays: initialProfile.arrivalDays,
        hasCaregiver: initialProfile.hasCaregiver
      });
    } catch (error) {
      console.error('Error assigning to transport:', error);
      setAssignDialog({
        open: true,
        message: 'אירעה שגיאה בשיבוץ להסעה: ' + error.message,
        type: 'error'
      });
    }
  };

  const validateAndSave = async (profileData) => {
    let hasErrors = false;
    const newErrors = {};

    // בדיקת תעודת זהות
    if (!profileData.id) {
      newErrors.id = "שדה חובה";
      hasErrors = true;
    } else if (!isValidIsraeliID(profileData.id)) {
      newErrors.id = "תעודת זהות חייבת להכיל 9 ספרות";
      hasErrors = true;
    }

    // בדיקת טלפון ראשי
    if (!profileData.phone) {
      newErrors.phone = "שדה חובה";
      hasErrors = true;
    } else if (!isValidPhoneNumber(profileData.phone)) {
      newErrors.phone = "מספר טלפון לא תקין";
      hasErrors = true;
    }

    // בדיקת טלפון נוסף (אם הוזן)
    if (profileData.phone2 && !isValidPhoneNumber(profileData.phone2)) {
      newErrors.phone2 = "מספר טלפון לא תקין";
      hasErrors = true;
    }

    // בדיקת שדות חובה נוספים
    if (!profileData.transport) {
      newErrors.transport = 'סוג הסעה הוא שדה חובה';
      hasErrors = true;
    }
    if (!profileData.arrivalDays || profileData.arrivalDays.length === 0) {
      newErrors.arrivalDays = 'ימי הגעה הם שדה חובה';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (!hasErrors) {
      let finalImageUrl = profileData.profileImage;

      // אם יש תמונה חדשה (data URL), העלה אותה לפיירבייס
      if (imagePreview && imagePreview !== initialProfile.profileImage) {
        setIsUploading(true);
        try {
          // המרת data URL לקובץ
          const response = await fetch(imagePreview);
          const blob = await response.blob();

          const fileName = `profile-images/${profileData.id}-${Date.now()}.jpg`;
          const storageRef = ref(storage, fileName);

          const snapshot = await uploadBytes(storageRef, blob);
          finalImageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('שגיאה בהעלאת התמונה: ' + error.message);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      await handleSave({
        ...profileData,
        profileImage: finalImageUrl
      });
    }
  };

  // עדכון הפונקציה המקורית של handleChange כדי להוסיף בדיקת טלפון
  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;

    // בדיקת תקינות תעודת זהות
    if (field === "id") {
      if (!value) {
        setErrors(prev => ({ ...prev, id: "שדה חובה" }));
      } else if (!isValidIsraeliID(value)) {
        setErrors(prev => ({ ...prev, id: "תעודת זהות חייבת להכיל 9 ספרות" }));
      } else {
        setErrors(prev => ({ ...prev, id: null }));
      }
    }

    // בדיקת תקינות מספר טלפון
    if (field === "phone") {
      if (!value) {
        setErrors(prev => ({ ...prev, phone: "שדה חובה" }));
      } else if (!isValidPhoneNumber(value)) {
        setErrors(prev => ({ ...prev, phone: "מספר טלפון לא תקין" }));
      } else {
        setErrors(prev => ({ ...prev, phone: null }));
      }
    }

    // בדיקת תקינות מספר טלפון נוסף
    if (field === "phone2") {
      if (!value) {
        setErrors(prev => ({ ...prev, phone2: null })); // מאפס את השגיאה אם השדה ריק
      } else if (!isValidPhoneNumber(value)) {
        setErrors(prev => ({ ...prev, phone2: "מספר טלפון לא תקין" }));
      } else {
        setErrors(prev => ({ ...prev, phone2: null }));
      }
    }

    handleChange(field)(e);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // בדיקות בסיסיות
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('אנא בחר קובץ תמונה תקין');
      return;
    }

    console.log('Original file:', { name: file.name, size: file.size, type: file.type });

    try {
      // דחוס את התמונה
      const compressedFile = await compressImage(file);
      console.log('Compressed file size:', compressedFile.size);

      // קרא את הקובץ המדוחס
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        handleChange("profileImage")({ target: { value: reader.result } });
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('שגיאה בעיבוד התמונה');
    }
  };

  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <>
      <Dialog
        open={true}
        onClose={handleCancelEdit}
        dir="rtl"
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: '800px',
            height: 'auto',
            maxWidth: 'none',
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          mb: 1,
          position: 'relative',
        }}>
          עריכת פרופיל
          <IconButton
            aria-label="close"
            onClick={handleCancelEdit}
            sx={{
              position: 'absolute',
              left: 8,
              top: 8,
              right: 'unset',
              color: (theme) => theme.palette.grey[600],
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: 'transparent', border: 'none', outline: 'none',
                boxShadow: 'none',
              },
              '&:focus': {
                border: 'none', outline: 'none', boxShadow: 'none',
              },
              '&:active': {
                border: 'none', outline: 'none', boxShadow: 'none',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <EditProfileFields
            profile={initialProfile}
            errors={errors}
            handleFieldChange={handleFieldChange}
            handleChange={handleChange}
            imagePreview={imagePreview}
            isUploading={isUploading}
            handleImageUpload={handleImageUpload}
            sortedArrivalDays={sortedArrivalDays}
          />
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 2
          }}>
            <Box>
              <Button
                onClick={handleAssignTransport}
                variant="outlined"
                disabled={loading || isUploading}
                sx={{
                  border: '1.7px solid rgba(64, 99, 112, 0.72)',
                  color: 'rgba(64, 99, 112, 0.72)',
                  fontWeight: 'bold',
                  ':hover': { borderColor: '#7b8f99', color: '#5a676e', outline: 'none' },
                  '&:focus': { outline: 'none' },
                  '&:active': { outline: 'none' },
                  minWidth: 'auto',
                }}
              >
                {loading ? 'מעדכן...' : 'עדכון הסעה'}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={handleCancelEdit}
                variant="outlined"
                sx={{
                  border: '1.7px solid rgba(64, 99, 112, 0.72)',
                  color: 'rgba(64, 99, 112, 0.72)',
                  fontWeight: 'bold',
                  ':hover': { borderColor: '#7b8f99', color: '#5a676e', outline: 'none' },
                  '&:focus': { outline: 'none' },
                  '&:active': { outline: 'none' },
                  minWidth: 'auto',
                }}
              >
                ביטול
              </Button>
              <Button
                onClick={() => validateAndSave(initialProfile)}
                variant="contained"
                color="primary"
                sx={{
                  backgroundColor: 'rgba(142, 172, 183, 0.72)',
                  color: 'black',
                  fontWeight: 'bold',
                  border: 'none', outline: 'none', boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'rgb(185, 205, 220)',
                    border: 'none', outline: 'none', boxShadow: 'none',
                  },
                  '&:focus': {
                    border: 'none', outline: 'none', boxShadow: 'none',
                  },
                  '&:active': {
                    border: 'none', outline: 'none', boxShadow: 'none',
                  },
                }}
              >
                שמור
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* דיאלוג בחירת הסעה */}
      <Dialog
        open={transportDialog.open}
        onClose={() => setTransportDialog({ open: false, transports: [] })}
        maxWidth="sm"
        fullWidth
        dir="rtl"
      >
        <DialogTitle>בחירת הסעה</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            נמצאו מספר הסעות מתאימות. אנא בחר הסעה:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {transportDialog.transports.map((transport) => (
              <Button
                key={transport.id}
                variant="outlined"
                onClick={() => handleTransportSelect(transport)}
                sx={{ justifyContent: 'flex-start', px: 2 }}
              >
                הסעה {transport.serialNumber}: {transport.cities.join(' -> ')}
                {transport.passengers ? ` (${transport.passengers.length} נוסעים)` : ' (ריקה)'}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransportDialog({ open: false, transports: [] })}>
            ביטול
          </Button>
        </DialogActions>
      </Dialog>

      <CustomDialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, message: '' })}
        title="שיבוץ להסעה"
        dialogContentSx={{ mt: 2 }}
        actions={<Button onClick={() => setSuccessDialog({ open: false, message: '' })}
          variant="contained"
          sx={{
            backgroundColor: 'rgba(142, 172, 183, 0.72)',
            color: 'black',
            fontWeight: 'bold',
            border: 'none', outline: 'none', boxShadow: 'none',
            '&:hover': {
              backgroundColor: 'rgb(185, 205, 220)',
              border: 'none', outline: 'none', boxShadow: 'none',
            },
            '&:focus': {
              border: 'none', outline: 'none', boxShadow: 'none',
            },
            '&:active': {
              border: 'none', outline: 'none', boxShadow: 'none',
            },
          }}
        >
          סגור
        </Button>}
      >
        {successDialog.message}
      </CustomDialog>

      {/* דיאלוג הודעה על חוסר הסעה */}
      <Dialog
        open={noTransportDialogOpen}
        onClose={() => { setNoTransportDialogOpen(false); handleCancelEdit(); }}
        dir="rtl"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          לא נמצאה הסעה מתאימה
          <Button onClick={() => { setNoTransportDialogOpen(false); handleCancelEdit(); }} sx={{ minWidth: 0, p: 0, color: 'grey.700' }}>×</Button>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            לא נמצאה הסעה מתאימה. יש להוסיף הסעה חדשה.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setNoTransportDialogOpen(false);
              handleCancelEdit();
              navigate('/Transport');
            }}
            variant="contained"
            color="primary"
          >
            מעבר לדף ההסעות
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default EditProfileWindow;