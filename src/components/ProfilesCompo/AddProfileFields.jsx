import {
  Box, Typography, FormControl, Select, MenuItem, Checkbox, FormControlLabel,
  TextField
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

export default function AddProfileFields({ values, errors, onChange, onImageChange, isUploading }) {

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

  // החלף את הפונקציה handleImageUpload הקיימת בזו:
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
        onImageChange(reader.result); // שימוש בפונקציה שמועברת כ-prop
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('שגיאה בעיבוד התמונה');
    }
  };

  const arrivalDaysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

  return (
    <>
      {/* העלאת תמונה */}
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
            {values.profileImage ? (
              <img
                src={values.profileImage}
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
        {!values.profileImage && !isUploading && (
          <Typography variant="body2" color="text.secondary">
            העלאת תמונת פרופיל
          </Typography>
        )}
      </div>

      {/* שדות טקסט */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          fullWidth
          label="שם"
          name="name"
          value={values.name}
          onChange={onChange}
          required
          error={!!errors.name}
          helperText={errors.name && "שדה חובה"}
          sx={{ maxWidth: "170px" }}
          inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
          InputProps={{ notched: false }}
          InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
        />
        <TextField
          fullWidth
          label="תעודת זהות"
          name="id"
          value={values.id}
          onChange={onChange}
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
          name="birthDate"
          type="date"
          value={values.birthDate}
          onChange={onChange}
          required
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

        {/* Select: מין */}
        <FormControl fullWidth sx={{ maxWidth: '170px' }}>
          <Select
            name="gender"
            value={values.gender}
            onChange={onChange}
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
          name="phone"
          value={values.phone}
          onChange={onChange}
          required
          error={!!errors.phone}
          helperText={errors.phone === true ? "שדה חובה" : errors.phone}
          sx={{ maxWidth: "170px" }}
          inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
          InputProps={{ notched: false }}
          InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
        />
        <TextField
          fullWidth
          label="טלפון נוסף"
          name="phone2"
          value={values.phone2}
          onChange={onChange}
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
          name="email"
          value={values.email || ''}
          onChange={onChange}
          sx={{ maxWidth: "170px" }}
          inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
          InputProps={{ notched: false }}
          InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
        />
        <TextField
          fullWidth
          label="כתובת"
          name="address"
          value={values.address}
          onChange={onChange}
          sx={{ maxWidth: "170px" }}
          inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
          InputProps={{ notched: false }}
          InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
        />
        <TextField
          fullWidth
          label="יישוב"
          name="city"
          value={values.city}
          onChange={onChange}
          required
          error={!!errors.city}
          helperText={errors.city && "שדה חובה"}
          sx={{ maxWidth: "170px" }}
          inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
          InputProps={{ notched: false }}
          InputLabelProps={{ sx: { right: 24, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: 'white', px: 0.5 } }}
        />

        {/* Select: סוג הסעה */}
        <FormControl fullWidth sx={{ maxWidth: '170px' }} error={!!errors.transport}>
          <Select
            name="transport"
            value={values.transport}
            onChange={onChange}
            displayEmpty
            inputProps={{ style: { textAlign: 'right' }, 'aria-label': 'הסעה' }}
            MenuProps={{
              PaperProps: {
                sx: { textAlign: 'right', direction: 'rtl' }
              }
            }}
          >
            <MenuItem value="" disabled hidden>
              הסעה
            </MenuItem>
            <MenuItem value="מונית">מונית</MenuItem>
            <MenuItem value="מיניבוס">מיניבוס</MenuItem>
            <MenuItem value="פרטי">פרטי</MenuItem>
            <MenuItem value="אחר">אחר</MenuItem>
          </Select>
          {errors.transport && <Typography color="error" fontSize="0.8rem">שדה חובה</Typography>}
        </FormControl>
      </Box>

      {/* ימי הגעה */}
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
                  checked={values.arrivalDays.includes(value)}
                  onChange={() => {
                    const isSelected = values.arrivalDays.includes(value);
                    let newDays = isSelected
                      ? values.arrivalDays.filter((d) => d !== value)
                      : [...values.arrivalDays, value];
                    // Sort according to arrivalDaysOrder
                    newDays = newDays.sort((a, b) => arrivalDaysOrder.indexOf(a) - arrivalDaysOrder.indexOf(b));
                    onChange({ target: { name: 'arrivalDays', value: newDays } });
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

      {/* Selectים נוספים */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <FormControl fullWidth sx={{ minWidth: '170px', width: '170px' }}>
          <Select
            name="eligibility"
            value={values.eligibility}
            onChange={onChange}
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

        <FormControl
          fullWidth
          sx={{ minWidth: '170px', width: '170px' }}
          disabled={values.eligibility !== "סיעוד"}
        >
          <Select
            name="nursingCompany"
            value={values.nursingCompany}
            onChange={onChange}
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

        <FormControl fullWidth sx={{ minWidth: '170px', width: '170px' }}>
          <Select
            name="functionLevel"
            value={values.functionLevel}
            onChange={onChange}
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
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ minWidth: '170px', width: '170px' }}>
          <Select
            name="membership"
            value={values.membership}
            onChange={onChange}
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
        {/* ניצול שואה */}
        <FormControlLabel
          control={
            <Checkbox
              checked={values.isHolocaustSurvivor}
              onChange={onChange}
              name="isHolocaustSurvivor"
            />
          }
          label="ניצול שואה"
          sx={{ minWidth: '100px', width: '120px', }}
        />
        {/* מטפל */}
        <FormControlLabel
          control={
            <Checkbox
              checked={values.hasCaregiver}
              onChange={onChange}
              name="hasCaregiver"
            />
          }
          label="מטפל"
          sx={{ minWidth: '100px', width: '120px' }}
        />
      </Box>
    </>
  );
}