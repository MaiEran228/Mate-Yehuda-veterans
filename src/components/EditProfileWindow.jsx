import {
  TextField, MenuItem, Checkbox, FormControlLabel, Typography, Box, Button
} from "@mui/material";

const GENDERS = ["זכר", "נקבה", "אחר"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

function EditProfileWindow({ profile, handleChange, handleDayChange, handleCancelEdit, handleSave }) {

  return (
    <>
      <TextField 
        fullWidth 
        label="שם" 
        value={profile.name || ''} 
        onChange={handleChange("name")} 
        sx={{ my: 1 }} 
      />
      <TextField 
        fullWidth 
        label="תעודת זהות" 
        value={profile.id || ''} 
        onChange={handleChange("id")} 
        sx={{ my: 1 }} 
      />
      <TextField 
        fullWidth 
        label="כתובת" 
        value={profile.address || ''} 
        onChange={handleChange("address")} 
        sx={{ my: 1 }} 
      />
      <TextField 
        fullWidth 
        label="יישוב" 
        value={profile.city || ''} 
        onChange={handleChange("city")} 
        sx={{ my: 1 }} 
      />
      <TextField 
        fullWidth 
        label="תאריך לידה" 
        type="date" 
        value={profile.birthDate || ''} 
        onChange={handleChange("birthDate")} 
        InputLabelProps={{ shrink: true }} 
        sx={{ my: 1 }} 
      />
      <TextField 
        fullWidth 
        label="טלפון" 
        value={profile.phone || ''} 
        onChange={handleChange("phone")} 
        sx={{ my: 1 }} 
      />
      <TextField 
        fullWidth 
        label="מייל" 
        value={profile.email || ''} 
        onChange={handleChange("email")} 
        sx={{ my: 1 }} 
      />

      <TextField
        select
        fullWidth
        label="מין"
        value={profile.gender || ''}
        onChange={handleChange("gender")}
        sx={{ my: 1 }}
      >
        {GENDERS.map((g) => (
          <MenuItem key={g} value={g}>
            {g}
          </MenuItem>
        ))}
      </TextField>

      <Box>
        <Typography>ימי הגעה:</Typography>
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

      <TextField
        select
        fullWidth
        label="הסעה"
        value={profile.transport || ''}
        onChange={handleChange("transport")}
        sx={{ my: 1 }}
      >
        <MenuItem value="מונית">מונית</MenuItem>
        <MenuItem value="הסעה">הסעה</MenuItem>
        <MenuItem value="אחר">אחר</MenuItem>
      </TextField>

      <TextField
        select
        fullWidth
        label="רמת תפקוד"
        value={profile.functionLevel || ''}
        onChange={handleChange("functionLevel")}
        sx={{ my: 1 }}
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
        sx={{ my: 1 }}
      >
        <MenuItem value="רווחה">רווחה</MenuItem>
        <MenuItem value="סיעוד">סיעוד</MenuItem>
        <MenuItem value="אחר">אחר</MenuItem>
      </TextField>

      {profile.eligibility === "סיעוד" && (
        <TextField 
          fullWidth 
          label="חברת סיעוד" 
          value={profile.nursingCompany || ''} 
          onChange={handleChange("nursingCompany")} 
          sx={{ my: 1 }} 
        />
      )}

      <TextField
        select
        fullWidth
        label="חבר ב-"
        value={profile.membership || ''}
        onChange={handleChange("membership")}
        sx={{ my: 1 }}
      >
        <MenuItem value="קהילה תומכת">קהילה תומכת</MenuItem>
        <MenuItem value="מרכז יום">מרכז יום</MenuItem>
        <MenuItem value="אחר">אחר</MenuItem>
      </TextField>

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

      <Box mt={2}>
        <Button onClick={handleCancelEdit}>ביטול</Button>
        <Button onClick={handleSave} variant="contained" sx={{ ml: 2 }}>
          שמור
        </Button>
      </Box>
    </>
  );
}

export default EditProfileWindow;