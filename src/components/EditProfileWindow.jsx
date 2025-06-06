import {
  TextField, MenuItem, Checkbox, FormControlLabel, Typography, Box, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, InputLabel, FormControl
} from "@mui/material";
import { useState, useEffect } from "react";
import { findMatchingTransports, addPassengerToTransport, getPassengerTransport, removePassengerFromTransports } from '../utils/transportUtils';

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

  // בודק אם השדות הרלוונטיים להסעה השתנו
  const hasTransportFieldsChanged = () => {
    return (
      initialProfile.city !== originalTransportData.city ||
      initialProfile.transport !== originalTransportData.transport ||
      initialProfile.hasCaregiver !== originalTransportData.hasCaregiver ||
      JSON.stringify(initialProfile.arrivalDays?.sort()) !== JSON.stringify(originalTransportData.arrivalDays?.sort())
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
      // קודם מסיר את הנוסע מההסעה הקודמת
      await removePassengerFromTransports(initialProfile.id);

      const matchingTransports = await findMatchingTransports(
        initialProfile.arrivalDays || [],
        initialProfile.city,
        initialProfile.transport,
        initialProfile.hasCaregiver || false
      );

      if (matchingTransports.length === 0) {
        alert('לא נמצאו הסעות מתאימות. יש להוסיף הסעה חדשה.');
      } else if (matchingTransports.length === 1) {
        const transport = matchingTransports[0];
        await addPassengerToTransport(transport.id, {
          id: initialProfile.id,
          name: initialProfile.name,
          phone: initialProfile.phone,
          city: initialProfile.city,
          hasCaregiver: initialProfile.hasCaregiver || false,
          arrivalDays: initialProfile.arrivalDays || []
        });
        alert(`${initialProfile.name} שובץ להסעה מספר ${transport.serialNumber} - ${transport.cities.join(' -> ')}`);
        
        // עדכון הנתונים המקוריים לאחר שיבוץ מוצלח
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
      alert('אירעה שגיאה בשיבוץ להסעה: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransportSelect = async (transport) => {
    try {
      // קודם מסיר את הנוסע מההסעה הקודמת
      await removePassengerFromTransports(initialProfile.id);
      
      await addPassengerToTransport(transport.id, {
        id: initialProfile.id,
        name: initialProfile.name,
        phone: initialProfile.phone,
        city: initialProfile.city,
        hasCaregiver: initialProfile.hasCaregiver || false,
        arrivalDays: initialProfile.arrivalDays || []
      });
      alert(`${initialProfile.name} שובץ להסעה מספר ${transport.serialNumber} - ${transport.cities.join(' -> ')}`);
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
      alert('אירעה שגיאה בשיבוץ להסעה: ' + error.message);
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

    setErrors(newErrors);

    if (!hasErrors) {
      await handleSave(profileData);
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                fullWidth
                label="שם"
                value={initialProfile.name || ''}
                required
                onChange={handleFieldChange("name")}
                sx={{ maxWidth: "170px" }}
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
              />

              <TextField
                fullWidth
                label="תאריך לידה"
                type="date"
                required
                value={initialProfile.birthDate || ''}
                onChange={handleFieldChange("birthDate")}
                InputLabelProps={{ shrink: true }}
                sx={{ maxWidth: "170px" }}
              />

              <TextField
                select
                fullWidth
                label="מין"
                value={initialProfile.gender || ''}
                onChange={handleFieldChange("gender")}
                sx={{ maxWidth: "170px" }}
              >
                {GENDERS.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="טלפון"
                value={initialProfile.phone || ''}
                onChange={handleFieldChange("phone")}
                required
                error={!!errors.phone}
                helperText={errors.phone}
                sx={{ maxWidth: "170px" }}
              />
              <TextField
                fullWidth
                label="טלפון נוסף"
                value={initialProfile.phone2 || ''}
                onChange={handleFieldChange("phone2")}
                error={!!errors.phone2}
                helperText={errors.phone2}
                sx={{ maxWidth: "170px" }}
              />

              <TextField
                fullWidth
                label="מייל"
                value={initialProfile.email || ''}
                onChange={handleFieldChange("email")}
                sx={{ maxWidth: "170px" }}
              />

              <TextField
                fullWidth
                label="כתובת"
                value={initialProfile.address || ''}
                onChange={handleFieldChange("address")}
                sx={{ maxWidth: "170px" }}
              />
              <TextField
                fullWidth
                label="יישוב"
                value={initialProfile.city || ''}
                onChange={handleFieldChange("city")}
                required
                sx={{ maxWidth: "170px" }}
              />

              <TextField
                select
                fullWidth
                label="הסעה"
                value={initialProfile.transport || ''}
                onChange={handleFieldChange("transport")}
                sx={{ maxWidth: "170px" }}
              >
                <MenuItem value="מונית">מונית</MenuItem>
                <MenuItem value="מיניבוס">מיניבוס</MenuItem>
                <MenuItem value="אחר">אחר</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 0, whiteSpace: 'nowrap' }}>ימי הגעה:</Typography>
                {DAYS.map((day) => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={initialProfile.arrivalDays?.includes(day) || false}
                        onChange={handleFieldChange(day)}
                      />
                    }
                    label={day}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                select
                fullWidth
                label="רמת תפקוד"
                value={initialProfile.functionLevel || ''}
                onChange={handleFieldChange("functionLevel")}
                sx={{ maxWidth: "170px" }}
              >
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="זכאות"
                value={initialProfile.eligibility || ''}
                onChange={handleFieldChange("eligibility")}
                sx={{ maxWidth: "170px" }}
              >
                <MenuItem value="רווחה">רווחה</MenuItem>
                <MenuItem value="סיעוד">סיעוד</MenuItem>
                <MenuItem value="אחר">אחר</MenuItem>
              </TextField>

              <TextField
                select
                fullWidth
                label="חברת סיעוד"
                value={initialProfile.nursingCompany || ''}
                onChange={handleFieldChange("nursingCompany")}
                disabled={initialProfile.eligibility !== "סיעוד"}
                sx={{ maxWidth: "170px" }}
              >
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
              </TextField>

              <TextField
                select
                fullWidth
                label="חבר ב-"
                value={initialProfile.membership || ''}
                onChange={handleFieldChange("membership")}
                sx={{ maxWidth: "170px" }}
              >
                <MenuItem value="קהילה תומכת">קהילה תומכת</MenuItem>
                <MenuItem value="מרכז יום">מרכז יום</MenuItem>
                <MenuItem value="אחר">אחר</MenuItem>
              </TextField>
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
                        disabled={
                            loading || 
                            !initialProfile.city || 
                            !initialProfile.transport || 
                            !initialProfile.arrivalDays?.length || 
                            !hasTransportFieldsChanged()
                        }
                    >
                        עדכון הסעה
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

      <Dialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, message: '' })}
        maxWidth="sm"
        fullWidth
        dir="rtl"
      >
        <DialogTitle>הפרופיל נשמר</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {successDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessDialog({ open: false, message: '' })}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default EditProfileWindow;