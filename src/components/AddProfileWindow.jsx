import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert
} from "@mui/material";
import { useState, useEffect } from "react";
import { findMatchingTransports, addPassengerToTransport } from '../utils/transportUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import ProfileFormFields from './ProfileFormFields';
import CustomDialog from './CustomDialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

function AddProfileWindow({ open, onClose, onSave }) {
    const initialFormData = {
        name: "", age: "", id: "", address: "", city: "", birthDate: "", phone: "", phone2: "", email: "",
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
        if (isUploading) {
            setErrors(prev => ({ ...prev, profileImage: "המתן לסיום העלאת התמונה" }));
            return;
        }
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
                    mb: 1,
                    position: 'relative',
                }}>
                    הוספת פרופיל חדש
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
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
                <DialogContent dir="ltr">
                    <Box sx={{ direction: 'rtl' }}>
                        {transportMessage && (
                            <Alert severity={transportMessage.type} sx={{ mb: 2 }}>
                                {transportMessage.text}
                            </Alert>
                        )}

                        {/* שדות טקסט */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <ProfileFormFields
                                values={formData}
                                errors={errors}
                                onChange={handleChange}
                                onImageChange={url => setFormData(prev => ({ ...prev, profileImage: url }))}
                                isUploading={isUploading}
                                setIsUploading={setIsUploading}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{
                            border: '1.7px solid rgba(64, 99, 112, 0.72)',
                            color: 'rgba(64, 99, 112, 0.72)',
                            fontWeight: 'bold',
                            ':hover': { borderColor: '#7b8f99', color: '#5a676e', outline: 'none' },
                            '&:focus': { outline: 'none' },
                            '&:active': { outline: 'none' },
                            minWidth: 'auto', ml: 2,
                        }}
                    >
                        ביטול
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary"
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
                </DialogActions>
            </Dialog>

            {/* דיאלוג בחירת הסעה */}
            <CustomDialog
                open={showTransportDialog}
                onClose={() => setShowTransportDialog(false)}
                title="בחירת הסעה"
                actions={
                    <Button onClick={() => setShowTransportDialog(false)}>
                        ביטול
                    </Button>
                }
            >
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
            </CustomDialog>

            {/* דיאלוג הודעת הצלחה */}
            <CustomDialog
                open={successDialog.open}
                onClose={handleCloseSuccessDialog}
                title="שיבוץ להסעה"
                dialogContentSx={{ mt: 2 }}
                actions={
                    <Button onClick={handleCloseSuccessDialog} variant="contained" color="primary"
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
                    </Button>
                }
            >
                {successDialog.message}
            </CustomDialog>

            {/* דיאלוג פרופיל קיים */}
            <CustomDialog
                open={existingProfileDialog}
                onClose={() => setExistingProfileDialog(false)}
                title="שגיאה"
                actions={
                    <Button onClick={() => setExistingProfileDialog(false)} variant="contained" color="primary">
                        סגור
                    </Button>
                }
            >
                איש זה קיים כבר במערכת
            </CustomDialog>

            {/* דיאלוג הודעה על חוסר הסעה */}
            <CustomDialog
                open={noTransportDialogOpen}
                onClose={() => { setNoTransportDialogOpen(false); onClose(); }}
                title="לא נמצאה הסעה מתאימה"
                dialogTitleSx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                dialogContentSx={{ mt: 2 }}
                actions={
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
                }
            >
                לא נמצאה הסעה מתאימה. יש להוסיף הסעה חדשה.
            </CustomDialog>
        </>
    );
}

export default AddProfileWindow;