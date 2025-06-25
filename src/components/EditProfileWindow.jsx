import {
  TextField, MenuItem, Checkbox, FormControlLabel, Typography, Box, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, FormControl,
} from "@mui/material";
import { useState } from "react";
import { findMatchingTransports, addPassengerToTransport, getPassengerTransport, removePassengerFromTransports } from '../utils/transportUtils';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useNavigate } from 'react-router-dom';
import CustomDialog from './CustomDialog';

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

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      handleChange("profileImage")({ target: { value: reader.result } });
    };
    reader.readAsDataURL(file);
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
          mb: 1
        }}>
          עריכת פרופיל
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', marginBottom: 16, width: '100%', justifyContent: 'center' }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-image-upload"
                type="file"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <label htmlFor="profile-image-upload">
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    backgroundColor: '#f5f5f5',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => !isUploading && (e.target.style.opacity = '0.8')}
                  onMouseLeave={(e) => !isUploading && (e.target.style.opacity = '1')}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="תמונת פרופיל"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : initialProfile.profileImage ? (
                    <img src={initialProfile.profileImage} alt="תמונת פרופיל" style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }} />
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
              {!imagePreview && !initialProfile.profileImage && !isUploading && (
                <Typography variant="body2" color="text.secondary">
                  העלאת תמונת פרופיל
                </Typography>
              )}
            </div>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                fullWidth
                label="שם"
                value={initialProfile.name || ''}
                required
                onChange={handleFieldChange("name")}
                sx={{ maxWidth: "170px" }}
                inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                InputProps={{ notched: false }}
                InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
              />
              <TextField
                fullWidth
                label="תעודת זהות"
                value={initialProfile.id || ''}
                onChange={handleFieldChange("id")}
                required
                error={!!errors.id}
                helperText={errors.id}
                sx={{ maxWidth: "170px" }}
                inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                InputProps={{ notched: false }}
                InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
              />

              <TextField
                fullWidth
                label="תאריך לידה"
                type="date"
                name="birthDate"
                required
                value={initialProfile.birthDate || ''}
                onChange={handleFieldChange("birthDate")}
                error={!!errors?.birthDate}
                helperText={errors?.birthDate && "שדה חובה"}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    right: 24,
                    left: 'unset',
                    textAlign: 'right',
                    transformOrigin: 'top right',
                    direction: 'rtl',
                    backgroundColor: 'white',
                    px: 0.5
                  }
                }}
                sx={{ maxWidth: "170px" }}
                inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                InputProps={{ notched: false }}
              />

              <FormControl fullWidth sx={{ maxWidth: '170px' }}>
                <Select
                  name="gender"
                  value={initialProfile.gender || ''}
                  onChange={handleFieldChange("gender")}
                  displayEmpty
                  inputProps={{ style: { textAlign: 'right' }, 'aria-label': 'מין' }}
                  MenuProps={{
                    PaperProps: {
                      sx: { textAlign: 'right', direction: 'rtl' }
                    }
                  }}
                >
                  <MenuItem value="" disabled hidden>
                    מין
                  </MenuItem>
                  <MenuItem value="זכר">זכר</MenuItem>
                  <MenuItem value="נקבה">נקבה</MenuItem>
                  <MenuItem value="אחר">אחר</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="טלפון"
                value={initialProfile.phone || ''}
                onChange={handleFieldChange("phone")}
                required
                error={!!errors.phone}
                helperText={errors.phone}
                sx={{ maxWidth: "170px" }}
                inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                InputProps={{ notched: false }}
                InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
              />
              <TextField
                fullWidth
                label="טלפון נוסף"
                value={initialProfile.phone2 || ''}
                onChange={handleFieldChange("phone2")}
                error={!!errors.phone2}
                helperText={errors.phone2}
                sx={{ maxWidth: "170px" }}
                inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                InputProps={{ notched: false }}
                InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
              />

              <TextField
                fullWidth
                label="מייל"
                value={initialProfile.email || ''}
                onChange={handleFieldChange("email")}
                sx={{ maxWidth: "170px" }}
                inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                InputProps={{ notched: false }}
                InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
              />

              <TextField
                fullWidth
                label="כתובת"
                value={initialProfile.address || ''}
                onChange={handleFieldChange("address")}
                sx={{ maxWidth: "170px" }}
                inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                InputProps={{ notched: false }}
                InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
              />
              <TextField
                fullWidth
                label="יישוב"
                value={initialProfile.city || ''}
                onChange={handleFieldChange("city")}
                required
                sx={{ maxWidth: "170px" }}
                inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                InputProps={{ notched: false }}
                InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
              />

              <TextField
                select
                fullWidth
                placeholder="סוג הסעה"
                value={initialProfile.transport || ''}
                onChange={handleFieldChange("transport")}
                name="transport"
                error={!!errors.transport}
                helperText={errors.transport}
                sx={{ maxWidth: "170px" }}

              >
                <MenuItem value="מונית">מונית</MenuItem>
                <MenuItem value="מיניבוס">מיניבוס</MenuItem>
                <MenuItem value="פרטי">פרטי</MenuItem>
                <MenuItem value="אחר">אחר</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 0, whiteSpace: 'nowrap', color: errors.arrivalDays ? 'error.main' : undefined }}>ימי הגעה:</Typography>
                {[
                  { label: 'א', value: 'ראשון' },
                  { label: 'ב', value: 'שני' },
                  { label: 'ג', value: 'שלישי' },
                  { label: 'ד', value: 'רביעי' },
                  { label: 'ה', value: 'חמישי' }
                ].map(({ label, value }) => (
                  <FormControlLabel
                    key={value}
                    control={
                      <Checkbox
                        checked={sortedArrivalDays.includes(value)}
                        onChange={() => {
                          const isSelected = sortedArrivalDays.includes(value);
                          const updatedDays = isSelected
                            ? sortedArrivalDays.filter((d) => d !== value)
                            : [...sortedArrivalDays, value];
                          handleChange("arrivalDays")({ target: { value: updatedDays } });
                        }}
                        sx={errors.arrivalDays ? { color: 'error.main' } : {}}
                      />
                    }
                    label={label}
                  />
                ))}
              </Box>
              {errors.arrivalDays && <Typography color="error" fontSize="0.8rem">שדה חובה</Typography>}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {/* רמת תפקוד */}
              <FormControl fullWidth sx={{ maxWidth: '170px' }}>
                <Select
                  name="functionLevel"
                  value={initialProfile.functionLevel || ''}
                  onChange={handleFieldChange("functionLevel")}
                  displayEmpty
                  inputProps={{ style: { textAlign: 'right' }, 'aria-label': 'רמת תפקוד' }}
                  MenuProps={{
                    PaperProps: {
                      sx: { textAlign: 'right', direction: 'rtl' }
                    }
                  }}
                >
                  <MenuItem value="" disabled hidden>
                    רמת תפקוד
                  </MenuItem>
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* זכאות */}
              <FormControl fullWidth sx={{ maxWidth: '170px' }}>
                <Select
                  name="eligibility"
                  value={initialProfile.eligibility || ''}
                  onChange={handleFieldChange("eligibility")}
                  displayEmpty
                  inputProps={{ style: { textAlign: 'right' }, 'aria-label': 'זכאות' }}
                  MenuProps={{
                    PaperProps: {
                      sx: { textAlign: 'right', direction: 'rtl' }
                    }
                  }}
                >
                  <MenuItem value="" disabled hidden>
                    זכאות
                  </MenuItem>
                  <MenuItem value="רווחה">רווחה</MenuItem>
                  <MenuItem value="סיעוד">סיעוד</MenuItem>
                  <MenuItem value="אחר">אחר</MenuItem>
                </Select>
              </FormControl>

              {/* חברת סיעוד */}
              <FormControl fullWidth sx={{ maxWidth: '170px' }} disabled={initialProfile.eligibility !== "סיעוד"}>
                <Select
                  name="nursingCompany"
                  value={initialProfile.nursingCompany || ''}
                  onChange={handleFieldChange("nursingCompany")}
                  displayEmpty
                  inputProps={{ style: { textAlign: 'right' }, 'aria-label': 'חברת סיעוד' }}
                  MenuProps={{
                    PaperProps: {
                      sx: { textAlign: 'right', direction: 'rtl' }
                    }
                  }}
                >
                  <MenuItem value="" disabled hidden>
                    חברת סיעוד
                  </MenuItem>
                  <MenuItem value="מטב">מט"ב</MenuItem>
                  <MenuItem value="דנאל- בית שמש">דנאל- בית שמש</MenuItem>
                  <MenuItem value="דנאל- רמלה">דנאל- רמלה</MenuItem>
                  <MenuItem value="א.ש ירושלים">א.ש ירושלים</MenuItem>
                  <MenuItem value="ראנד">ראנד</MenuItem>
                  <MenuItem value="תגבור">תגבור</MenuItem>
                  <MenuItem value="נתן">נתן</MenuItem>
                  <MenuItem value="עמל- בית שמש">עמל- בית שמש</MenuItem>
                  <MenuItem value="עמל- ירושלים">עמל- ירושלים</MenuItem>
                  <MenuItem value="ביטוח לאומי">ביטוח לאומי</MenuItem>
                  <MenuItem value="אחר">אחר</MenuItem>
                </Select>
              </FormControl>

              {/* חבר ב- */}
              <FormControl fullWidth sx={{ maxWidth: '170px' }}>
                <Select
                  name="membership"
                  value={initialProfile.membership || ''}
                  onChange={handleFieldChange("membership")}
                  displayEmpty
                  inputProps={{ style: { textAlign: 'right' }, 'aria-label': 'חבר ב־' }}
                  MenuProps={{
                    PaperProps: {
                      sx: { textAlign: 'right', direction: 'rtl' }
                    }
                  }}
                >
                  <MenuItem value="" disabled hidden>
                    חבר ב־
                  </MenuItem>
                  <MenuItem value="קהילה תומכת">קהילה תומכת</MenuItem>
                  <MenuItem value="מרכז יום">מרכז יום</MenuItem>
                  <MenuItem value="אחר">אחר</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={initialProfile.isHolocaustSurvivor || false}
                    onChange={handleFieldChange("isHolocaustSurvivor")}
                  />
                }
                label="ניצול שואה"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={initialProfile.hasCaregiver || false}
                    onChange={handleFieldChange("hasCaregiver")}
                  />
                }
                label="מטפל"
              />
            </Box>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',  // מפריד בין הכפתורים לשני הצדדים
              mt: 2
            }}>
              {/* כפתור עדכון הסעה בצד ימין */}
              <Box>
                <Button
                  onClick={handleAssignTransport}
                  variant="outlined"
                  color="primary"
                  disabled={loading || isUploading}
                >
                  {loading ? 'מעדכן...' : 'עדכון הסעה'}
                </Button>
              </Box>

              {/* כפתורי שמירה וביטול בצד שמאל */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={handleCancelEdit}
                  variant="outlined"
                  color="error"
                >
                  ביטול
                </Button>

                <Button
                  onClick={() => validateAndSave(initialProfile)}
                  variant="contained"
                  color="primary"
                >
                  שמור
                </Button>
              </Box>
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
        open={assignDialog.open}
        onClose={() => setAssignDialog({ ...assignDialog, open: false })}
        title={assignDialog.type === 'error' ? 'שגיאה' : 'הצלחה'}
        actions={<Button onClick={() => setAssignDialog({ ...assignDialog, open: false })} variant="contained">סגור</Button>}
      >
        {assignDialog.message}
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