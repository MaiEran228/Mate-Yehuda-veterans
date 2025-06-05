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

  // בודק אם השדות הרלוונטיים להסעה השתנו
  const hasTransportFieldsChanged = () => {
    return (
      initialProfile.city !== originalTransportData.city ||
      initialProfile.transport !== originalTransportData.transport ||
      initialProfile.hasCaregiver !== originalTransportData.hasCaregiver ||
      JSON.stringify(initialProfile.arrivalDays?.sort()) !== JSON.stringify(originalTransportData.arrivalDays?.sort())
    );
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
                onChange={handleChange("name")}
                sx={{ maxWidth: "170px" }}
              />
              <TextField
                fullWidth
                label="תעודת זהות"
                value={initialProfile.id || ''}
                onChange={handleChange("id")}
                required
                sx={{ maxWidth: "170px" }}
              />

              <TextField
                fullWidth
                label="תאריך לידה"
                type="date"
                required
                value={initialProfile.birthDate || ''}
                onChange={handleChange("birthDate")}
                InputLabelProps={{ shrink: true }}
                sx={{ maxWidth: "170px" }}
              />

              <TextField
                select
                fullWidth
                label="מין"
                value={initialProfile.gender || ''}
                onChange={handleChange("gender")}
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
                onChange={handleChange("phone")}
                sx={{ maxWidth: "170px" }}
                required
                error={!initialProfile.phone}
                helperText={!initialProfile.phone && "שדה חובה"}
              />
              <TextField
                fullWidth
                label="טלפון נוסף"
                value={initialProfile.phone2 || ''}
                onChange={handleChange("phone2")}
                sx={{ maxWidth: "170px" }}
              />

              <TextField
                fullWidth
                label="מייל"
                value={initialProfile.email || ''}
                onChange={handleChange("email")}
                sx={{ maxWidth: "170px" }}
              />

              <TextField
                fullWidth
                label="כתובת"
                value={initialProfile.address || ''}
                onChange={handleChange("address")}
                sx={{ maxWidth: "170px" }}
              />
              <TextField
                fullWidth
                label="יישוב"
                value={initialProfile.city || ''}
                onChange={handleChange("city")}
                required
                sx={{ maxWidth: "170px" }}
              />

              <TextField
                select
                fullWidth
                label="הסעה"
                value={initialProfile.transport || ''}
                onChange={handleChange("transport")}
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
                        onChange={handleDayChange(day)}
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
                onChange={handleChange("functionLevel")}
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
                onChange={handleChange("eligibility")}
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
                onChange={handleChange("nursingCompany")}
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
                onChange={handleChange("membership")}
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
                    onChange={handleChange("isHolocaustSurvivor")}
                  />
                }
                label="ניצול שואה"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={initialProfile.hasCaregiver || false}
                    onChange={handleChange("hasCaregiver")}
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
                        onClick={handleSave}
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
    </>
  );
}

export default EditProfileWindow;