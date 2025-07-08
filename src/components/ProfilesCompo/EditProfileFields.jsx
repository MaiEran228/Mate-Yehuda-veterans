import { TextField, MenuItem, Checkbox, FormControlLabel, Typography, Box, Select, FormControl } from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

const GENDERS = ["זכר", "נקבה", "אחר"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

function EditProfileFields({
  profile,
  errors,
  handleFieldChange,
  handleChange,
  imagePreview,
  isUploading,
  handleImageUpload,
  sortedArrivalDays
}) {
  return (
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
            ) : profile.profileImage ? (
              <img src={profile.profileImage} alt="תמונת פרופיל" style={{
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
        {!imagePreview && !profile.profileImage && !isUploading && (
          <Typography variant="body2" color="text.secondary">
            העלאת תמונת פרופיל
          </Typography>
        )}
      </div>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          fullWidth
          label="שם"
          value={profile.name || ''}
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
          value={profile.id || ''}
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
          value={profile.birthDate || ''}
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
            value={profile.gender || ''}
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
          value={profile.phone || ''}
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
          value={profile.phone2 || ''}
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
          value={profile.email || ''}
          onChange={handleFieldChange("email")}
          sx={{ maxWidth: "170px" }}
          inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
          InputProps={{ notched: false }}
          InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
        />
        <TextField
          fullWidth
          label="כתובת"
          value={profile.address || ''}
          onChange={handleFieldChange("address")}
          sx={{ maxWidth: "170px" }}
          inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
          InputProps={{ notched: false }}
          InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
        />
        <TextField
          fullWidth
          label="יישוב"
          value={profile.city || ''}
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
          value={profile.transport || ''}
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
        {/* Function level */}
        <FormControl fullWidth sx={{ maxWidth: '170px' }}>
          <Select
            name="functionLevel"
            value={profile.functionLevel || ''}
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
            value={profile.eligibility || ''}
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
            <MenuItem value="סיעוד">סיעוד</MenuItem>
            <MenuItem value="פרטי">פרטי</MenuItem>
            <MenuItem value="רווחה">רווחה</MenuItem>
            <MenuItem value="אחר">אחר</MenuItem>
          </Select>
        </FormControl>
        {/* Nursing company */}
        <FormControl fullWidth sx={{ maxWidth: '170px' }} disabled={profile.eligibility !== "סיעוד"}>
          <Select
            name="nursingCompany"
            value={profile.nursingCompany || ''}
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
            <MenuItem value="א.ש ירושלים">א.ש ירושלים</MenuItem>
            <MenuItem value="ביטוח לאומי">ביטוח לאומי</MenuItem>
            <MenuItem value="דנאל- בית שמש">דנאל- בית שמש</MenuItem>
            <MenuItem value="דנאל- ירושלים">דנאל- ירושלים</MenuItem>
            <MenuItem value="דנאל- רמלה">דנאל- רמלה</MenuItem>
            <MenuItem value="מטב">מט"ב</MenuItem>
            <MenuItem value="נתן">נתן</MenuItem>
            <MenuItem value="עמל- בית שמש">עמל- בית שמש</MenuItem>
            <MenuItem value="עמל- לוד">עמל- לוד</MenuItem>
            <MenuItem value="עמל- ירושלים">עמל- ירושלים</MenuItem>
            <MenuItem value="ראנד">ראנד</MenuItem>
            <MenuItem value="תגבור">תגבור</MenuItem>
            <MenuItem value="תגבור- ירושלים">תגבור- ירושלים</MenuItem>
            <MenuItem value="ללא חברה">ללא חברה</MenuItem>
            <MenuItem value="אחר">אחר</MenuItem>
          </Select>
        </FormControl>
        {/* Membership */}
        <FormControl fullWidth sx={{ maxWidth: '170px' }}>
          <Select
            name="membership"
            value={profile.membership || ''}
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
            <MenuItem value="לא קהילה תומכת">לא קהילה תומכת</MenuItem>
            <MenuItem value="אחר">אחר</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={profile.isHolocaustSurvivor || false}
              onChange={handleFieldChange("isHolocaustSurvivor")}
            />
          }
          label="ניצול שואה"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={profile.hasCaregiver || false}
              onChange={handleFieldChange("hasCaregiver")}
            />
          }
          label="מטפל"
        />
      </Box>
    </Box>
  );
}

export default EditProfileFields; 