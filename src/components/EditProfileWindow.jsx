import {
  TextField, MenuItem, Checkbox, FormControlLabel, Typography, Box, Button,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";

const GENDERS = ["זכר", "נקבה", "אחר"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

function EditProfileWindow({ profile, handleChange, handleDayChange, handleCancelEdit, handleSave }) {
  return (
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
              value={profile.name || ''}
              required
              onChange={handleChange("name")}
              sx={{ maxWidth: "170px" }}
            />
            <TextField
              fullWidth
              label="תעודת זהות"
              value={profile.id || ''}
              onChange={handleChange("id")}
              required
              sx={{ maxWidth: "170px" }}
            />

            <TextField
              fullWidth
              label="תאריך לידה"
              type="date"
              required
              value={profile.birthDate || ''}
              onChange={handleChange("birthDate")}
              InputLabelProps={{ shrink: true }}
              sx={{ maxWidth: "170px" }}
            />

            <TextField
              select
              fullWidth
              label="מין"
              value={profile.gender || ''}
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
              value={profile.phone || ''}
              onChange={handleChange("phone")}
              sx={{ maxWidth: "170px" }}
              required
              error={!profile.phone}
              helperText={!profile.phone && "שדה חובה"}
            />
            <TextField
              fullWidth
              label="טלפון נוסף"
              value={profile.phone2 || ''}
              onChange={handleChange("phone2")}
              sx={{ maxWidth: "170px" }}
            />

            <TextField
              fullWidth
              label="מייל"
              value={profile.email || ''}
              onChange={handleChange("email")}
              sx={{ maxWidth: "170px" }}
            />

            <TextField
              fullWidth
              label="כתובת"
              value={profile.address || ''}
              onChange={handleChange("address")}
              sx={{ maxWidth: "170px" }}
            />
            <TextField
              fullWidth
              label="יישוב"
              value={profile.city || ''}
              onChange={handleChange("city")}
              required
              sx={{ maxWidth: "170px" }}
            />

            <TextField
              select
              fullWidth
              label="הסעה"
              value={profile.transport || ''}
              onChange={handleChange("transport")}
              sx={{ maxWidth: "170px" }}
            >
              <MenuItem value="מונית">מונית</MenuItem>
              <MenuItem value="הסעה">הסעה</MenuItem>
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
                      checked={profile.arrivalDays?.includes(day) || false}
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
              value={profile.functionLevel || ''}
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
              value={profile.eligibility || ''}
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
              value={profile.nursingCompany || ''}
              onChange={handleChange("nursingCompany")}
              disabled={profile.eligibility !== "סיעוד"}
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
              value={profile.membership || ''}
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
                  checked={profile.isHolocaustSurvivor || false}
                  onChange={handleChange("isHolocaustSurvivor")}
                />
              }
              label="ניצול שואה"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={profile.hasCaregiver || false}
                  onChange={handleChange("hasCaregiver")}
                />
              }
              label="מטפל"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelEdit}>ביטול</Button>
        <Button onClick={handleSave} variant="contained" sx={{ ml: 2 }}>
          שמור
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditProfileWindow;