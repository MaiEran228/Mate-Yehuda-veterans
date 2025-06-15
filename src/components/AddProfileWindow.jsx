import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControlLabel, Checkbox, MenuItem,
    Select, InputLabel, FormControl, Typography, Box, Alert, IconButton, Avatar
} from "@mui/material";
import { useState, useEffect } from "react";
import { findMatchingTransports, addPassengerToTransport } from '../utils/transportUtils';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useNavigate } from 'react-router-dom';

function AddProfileWindow({ open, onClose, onSave }) {
    const initialFormData = {
        name: "", age: "", id: "", address: "", city: "", birthDate: "", phone: "", phone2:"", email: "",
        transport: "", functionLevel: "", gender: "", arrivalDays: [], eligibility: "", isHolocaustSurvivor: false,
        hasCaregiver: false, membership: "", nursingCompany: "", profileImage: "",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [transportMessage, setTransportMessage] = useState(null);
    const [matchingTransports, setMatchingTransports] = useState([]);
    const [showTransportDialog, setShowTransportDialog] = useState(false);
    const [successDialog, setSuccessDialog] = useState({ open: false, message: '' });
    const [existingProfileDialog, setExistingProfileDialog] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [noTransportDialogOpen, setNoTransportDialogOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (open) {
            setFormData(initialFormData);
            setErrors({});
            setTransportMessage(null);
            setMatchingTransports([]);
            setShowTransportDialog(false);
            setExistingProfileDialog(false);
            setImagePreview(null);
        }
    }, [open]);

    const checkExistingId = async (id) => {
        try {
            const profileRef = doc(db, 'profiles', id);
            const profileSnap = await getDoc(profileRef);
            
            if (profileSnap.exists()) {
                setErrors(prev => ({
                    ...prev,
                    id: "תעודת זהות קיימת במערכת"
                }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking ID:', error);
            return false;
        }
    };

    const isValidPhoneNumber = (phone) => {
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

    const handleChange = async (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        // בדיקת תקינות תעודת זהות
        if (name === "id") {
            if (!value) {
                setErrors(prev => ({ ...prev, id: "שדה חובה" }));
            } else if (!isValidIsraeliID(value)) {
                setErrors(prev => ({ ...prev, id: "תעודת זהות חייבת להכיל 9 ספרות" }));
            } else {
                const exists = await checkExistingId(value);
                if (!exists) {
                    setErrors(prev => ({ ...prev, id: null }));
                }
            }
        } else if (name === "phone") {
            // בדיקת תקינות מספר טלפון
            if (!value) {
                setErrors(prev => ({ ...prev, phone: "שדה חובה" }));
            } else if (!isValidPhoneNumber(value)) {
                setErrors(prev => ({ ...prev, phone: "מספר טלפון לא תקין" }));
            } else {
                setErrors(prev => ({ ...prev, phone: null }));
            }
        } else if (name === "phone2") {
            // בדיקת תקינות מספר טלפון נוסף
            if (!value) {
                setErrors(prev => ({ ...prev, phone2: null }));
            } else if (!isValidPhoneNumber(value)) {
                setErrors(prev => ({ ...prev, phone2: "מספר טלפון לא תקין" }));
            } else {
                setErrors(prev => ({ ...prev, phone2: null }));
            }
        } else if (name === "eligibility" && value !== "סיעוד") {
            setFormData((prev) => ({ ...prev, nursingCompany: "" }));
        } else {
            // איפוס שגיאות רק לשדות שאינם דורשים בדיקת תקינות מיוחדת
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async () => {
        const requiredFields = ["name", "id", "city", "birthDate", "phone", "transport", "arrivalDays"];
        const newErrors = {};
        
        // בדיקת שדות חובה
        requiredFields.forEach((field) => {
            if (!formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0)) {
                newErrors[field] = "שדה חובה";
            }
        });

        // בדיקת תקינות תעודת זהות
        if (formData.id) {
            if (!isValidIsraeliID(formData.id)) {
                newErrors.id = "תעודת זהות חייבת להכיל 9 ספרות";
            } else {
                const exists = await checkExistingId(formData.id);
                if (exists) {
                    setExistingProfileDialog(true);
                    return;
                }
            }
        }

        // בדיקת תקינות מספר טלפון ראשי
        if (formData.phone && !isValidPhoneNumber(formData.phone)) {
            newErrors.phone = "מספר טלפון לא תקין";
        }

        // בדיקת תקינות מספר טלפון נוסף (אם הוזן)
        if (formData.phone2 && !isValidPhoneNumber(formData.phone2)) {
            newErrors.phone2 = "מספר טלפון לא תקין";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            // Create a clean profile object with all the data
            const profileToSave = {
                ...formData,
                profileImage: formData.profileImage || null // Make sure to include the image URL
            };

            console.log('Saving profile with data:', profileToSave); // For debugging

            if (profileToSave.transport === 'פרטי') {
                profileToSave.isPrivateTransport = true;
                await onSave(profileToSave);
                setFormData(initialFormData);
                setErrors({});
                setImagePreview(null);
                onClose();
                return;
            }

            const transports = await findMatchingTransports(
                profileToSave.arrivalDays,
                profileToSave.city,
                profileToSave.transport,
                profileToSave.hasCaregiver
            );

            if (transports.length === 0) {
                await onSave(profileToSave);
                setNoTransportDialogOpen(true);
            } else if (transports.length === 1) {
                await addPassengerToTransport(transports[0].id, {
                    id: profileToSave.id,
                    name: profileToSave.name,
                    phone: profileToSave.phone,
                    city: profileToSave.city,
                    hasCaregiver: profileToSave.hasCaregiver,
                    arrivalDays: profileToSave.arrivalDays,
                    profileImage: profileToSave.profileImage // Make sure to include the image URL here too
                });

                const successMessage = `${profileToSave.name} שובץ להסעה מספר ${transports[0].serialNumber} - ${transports[0].cities.join(' -> ')}`;
                setSuccessDialog({ open: true, message: successMessage });
                await onSave(profileToSave);
                setFormData(initialFormData);
                setErrors({});
                setImagePreview(null);
                onClose();
            } else {
                setMatchingTransports(transports);
                setShowTransportDialog(true);
                return;
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setTransportMessage({
                type: 'error',
                text: 'אירעה שגיאה בשמירת הפרופיל. אנא נסו שנית.'
            });
        }
    };

    const handleTransportSelect = async (transport) => {
        try {
            await addPassengerToTransport(transport.id, {
                id: formData.id,
                name: formData.name,
                phone: formData.phone,
                city: formData.city,
                hasCaregiver: formData.hasCaregiver,
                arrivalDays: formData.arrivalDays
            });

            const successMessage = `${formData.name} שובץ להסעה מספר ${transport.serialNumber} - ${transport.cities.join(' -> ')}`;
            setSuccessDialog({ open: true, message: successMessage });
            
            await onSave(formData);
            setFormData(initialFormData);
            setErrors({});
            setShowTransportDialog(false);
            onClose();
        } catch (error) {
            console.error('Error assigning to transport:', error);
            setTransportMessage({
                type: 'error',
                text: 'אירעה שגיאה בשיבוץ להסעה. אנא נסו שנית.'
            });
        }
    };

    const handleCloseSuccessDialog = () => {
        setSuccessDialog({ open: false, message: '' });
        onClose();
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Preview the image
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        try {
            setIsUploading(true);
            // Create a reference to the storage location with a unique filename
            const uniqueFileName = `${Date.now()}-${file.name}`;
            const storageRef = ref(storage, `profile-images/${uniqueFileName}`);
            
            // Upload the file
            const snapshot = await uploadBytes(storageRef, file);
            
            // Get the download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('File uploaded, URL:', downloadURL); // For debugging
            
            // Update form data with the image URL
            setFormData(prev => ({
                ...prev,
                profileImage: downloadURL
            }));
            
            setIsUploading(false);
        } catch (error) {
            console.error("Error uploading image:", error);
            setIsUploading(false);
        }
    };

    const validateAndSave = async (profileData) => {
        let hasErrors = false;
        const newErrors = {};

        // בדיקת שדות חובה
        if (!profileData.name) {
            newErrors.name = 'שם הוא שדה חובה';
            hasErrors = true;
        }
        if (!profileData.phone) {
            newErrors.phone = 'טלפון הוא שדה חובה';
            hasErrors = true;
        }
        if (!profileData.city) {
            newErrors.city = 'עיר היא שדה חובה';
            hasErrors = true;
        }
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
            await handleSubmit();
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
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
                    הוספת פרופיל חדש
                </DialogTitle>
                <DialogContent dir="ltr">
                    <Box sx={{ direction: 'rtl' }}>
                        {transportMessage && (
                            <Alert severity={transportMessage.type} sx={{ mb: 2 }}>
                                {transportMessage.text}
                            </Alert>
                        )}
                        
                        {/* Image Upload Section */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            gap: 1,
                            position: 'relative',
                            mb: 2
                        }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="profile-image-upload"
                                type="file"
                                onChange={handleImageUpload}
                            />
                            <label htmlFor="profile-image-upload">
                                <Avatar
                                    src={imagePreview}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        bgcolor: 'grey.200',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            opacity: 0.8
                                        }
                                    }}
                                >
                                    {!imagePreview && <AddPhotoAlternateIcon sx={{ fontSize: 40 }} />}
                                </Avatar>
                            </label>
                            {isUploading && (
                                <Typography variant="body2" color="text.secondary">
                                    מעלה תמונה...
                                </Typography>
                            )}
                            {!imagePreview && !isUploading && (
                                <Typography variant="body2" color="text.secondary">
                                    העלאת תמונת פרופיל
                                </Typography>
                            )}
                        </Box>

                        {/* שדות טקסט */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <TextField
                                fullWidth
                                placeholder="שם"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                error={errors.name}
                                helperText={errors.name && "שדה חובה"}
                                sx={{ maxWidth: "170px" }}
                                inputProps={{ style: { textAlign: 'right' } }}
                                InputProps={{ notched: false }}
                            />

                            <TextField
                                fullWidth
                                placeholder="תעודת זהות"
                                name="id"
                                value={formData.id}
                                onChange={handleChange}
                                required
                                error={!!errors.id}
                                helperText={errors.id}
                                sx={{ maxWidth: "170px" }}
                                inputProps={{ style: { textAlign: 'right' } }}
                                InputProps={{ notched: false }}
                            />

                            <TextField
                                fullWidth
                                label="תאריך לידה"
                                name="birthDate"
                                type="date"
                                value={formData.birthDate}
                                onChange={handleChange}
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
                                inputProps={{ style: { textAlign: 'right' } }}
                                InputProps={{ notched: false }}
                            />

                            <FormControl fullWidth sx={{ maxWidth: "170px" }}>
                                <Select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
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
                                placeholder="טלפון"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                error={!!errors.phone}
                                helperText={errors.phone === true ? "שדה חובה" : errors.phone}
                                sx={{ maxWidth: "170px" }}
                                inputProps={{ style: { textAlign: 'right' } }}
                                InputProps={{ notched: false }}
                            />

                            <TextField
                                fullWidth
                                placeholder="טלפון נוסף"
                                name="phone2"
                                value={formData.phone2}
                                onChange={handleChange}
                                error={!!errors.phone2}
                                helperText={errors.phone2}
                                sx={{ maxWidth: "170px" }}
                                inputProps={{ style: { textAlign: 'right' } }}
                                InputProps={{ notched: false }}
                            />

                            <TextField
                                fullWidth
                                placeholder="מייל"
                                name="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                sx={{ maxWidth: "170px" }}
                                inputProps={{ style: { textAlign: 'right' } }}
                                InputProps={{ notched: false }}
                            />

                            <TextField
                                fullWidth
                                placeholder="כתובת"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                sx={{ maxWidth: "170px" }}
                                inputProps={{ style: { textAlign: 'right' } }}
                                InputProps={{ notched: false }}
                            />

                            <TextField
                                fullWidth
                                placeholder="יישוב"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                                error={errors.city}
                                helperText={errors.city && "שדה חובה"}
                                sx={{ maxWidth: "170px" }}
                                inputProps={{ style: { textAlign: 'right' } }}
                                InputProps={{ notched: false }}
                            />

                            <FormControl fullWidth sx={{ maxWidth: "170px" }} error={!!errors.transport}>
                                <Select
                                    name="transport"
                                    value={formData.transport}
                                    onChange={handleChange}
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

                        {/* ימי הגעה בשורה נפרדת */}
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
                                                checked={formData.arrivalDays.includes(value)}
                                                onChange={() => {
                                                    setFormData((prev) => {
                                                        const isSelected = prev.arrivalDays.includes(value);
                                                        const newDays = isSelected
                                                            ? prev.arrivalDays.filter((d) => d !== value)
                                                            : [...prev.arrivalDays, value];
                                                        return { ...prev, arrivalDays: newDays };
                                                    });
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

                        {/* שדות נוספים */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <FormControl fullWidth sx={{ maxWidth: "170px" }}>
                                <Select
                                    name="functionLevel"
                                    value={formData.functionLevel}
                                    onChange={handleChange}
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

                            <FormControl fullWidth sx={{ maxWidth: "170px" }}>
                                <Select
                                    name="eligibility"
                                    value={formData.eligibility}
                                    onChange={handleChange}
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

                            <FormControl
                                fullWidth
                                sx={{ maxWidth: "170px" }}
                                disabled={formData.eligibility !== "סיעוד"}
                            >
                                <Select
                                    name="nursingCompany"
                                    value={formData.nursingCompany}
                                    onChange={handleChange}
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

                            <FormControl fullWidth sx={{ maxWidth: "170px" }}>
                                <Select
                                    name="membership"
                                    value={formData.membership}
                                    onChange={handleChange}
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

                        {/* צ'קבוקסים */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.isHolocaustSurvivor}
                                        onChange={handleChange}
                                        name="isHolocaustSurvivor"
                                    />
                                }
                                label="ניצול שואה"
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.hasCaregiver}
                                        onChange={handleChange}
                                        name="hasCaregiver"
                                    />
                                }
                                label="מטפל"
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>ביטול</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג בחירת הסעה */}
            <Dialog
                open={showTransportDialog}
                onClose={() => setShowTransportDialog(false)}
                dir="rtl"
            >
                <DialogTitle>בחירת הסעה</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        נמצאו מספר הסעות מתאימות. אנא בחר הסעה:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {matchingTransports.map((transport, index) => (
                            <Button
                                key={transport.id}
                                variant="outlined"
                                onClick={() => handleTransportSelect(transport)}
                                sx={{ justifyContent: 'flex-start', px: 2 }}
                            >
                                הסעה {index + 1}: {transport.cities.join(' -> ')}
                                {transport.passengers ? ` (${transport.passengers.length} נוסעים)` : ' (ריקה)'}
                            </Button>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowTransportDialog(false)}>ביטול</Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג הודעת הצלחה */}
            <Dialog
                open={successDialog.open}
                onClose={handleCloseSuccessDialog}
                dir="rtl"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    שיבוץ להסעה
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        {successDialog.message}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSuccessDialog} variant="contained" color="primary">
                        סגור
                    </Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג פרופיל קיים */}
            <Dialog
                open={existingProfileDialog}
                onClose={() => setExistingProfileDialog(false)}
                dir="rtl"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    שגיאה
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        איש זה קיים כבר במערכת
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExistingProfileDialog(false)} variant="contained" color="primary">
                        סגור
                    </Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג הודעה על חוסר הסעה */}
            <Dialog
                open={noTransportDialogOpen}
                onClose={() => { setNoTransportDialogOpen(false); onClose(); }}
                dir="rtl"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    לא נמצאה הסעה מתאימה
                    <Button onClick={() => { setNoTransportDialogOpen(false); onClose(); }} sx={{ minWidth: 0, p: 0, color: 'grey.700' }}>×</Button>
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
                            onClose();
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

export default AddProfileWindow;