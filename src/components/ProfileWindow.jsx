import { useState, useEffect } from "react";
import { deleteProfile } from "../firebase";
import { removePassengerFromTransports, getPassengerTransport } from "../utils/transportUtils";
import {
    Dialog, DialogTitle, DialogContent, Typography, Button, TextField, MenuItem, Checkbox, FormControlLabel,
    Box, Avatar
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import EditProfileWindow from "./EditProfileWindow";

const GENDERS = ["זכר", "נקבה", "אחר"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

function ProfileWindow({ open, onClose, profile: initialProfile, onSave, onDelete }) {
    if (!initialProfile) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(initialProfile || {});
    const [transportDetails, setTransportDetails] = useState(null);

    // עדכון הפרופיל והסעה כאשר initialProfile משתנה
    useEffect(() => {
        if (initialProfile) {
            setProfile(initialProfile);
            // מביא את פרטי ההסעה של הנוסע
            const fetchTransportDetails = async () => {
                try {
                    const transport = await getPassengerTransport(initialProfile.id);
                    setTransportDetails(transport);
                } catch (error) {
                    console.error('Error fetching transport details:', error);
                }
            };
            fetchTransportDetails();
        }
    }, [initialProfile]);

    const handleDelete = async () => {
        const confirm = window.confirm(`האם למחוק את ${profile.name}?`);
        if (confirm) {
            try {
                // קודם מוחקים את הנוסע מכל ההסעות
                await removePassengerFromTransports(profile.id);
                // אחר כך מוחקים את הפרופיל
                await onDelete(profile.id);
            } catch (error) {
                console.error('Error deleting profile:', error);
                alert('שגיאה במחיקת הפרופיל');
            }
        }
    };

    // פונקציה לשמירת שינויים
    const handleSave = async (updatedProfile) => {
        try {
            if (onSave) {
                await onSave(updatedProfile);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('שגיאה בשמירת הפרופיל');
        }
    };

    // פונקציה לביטול עריכה
    const handleCancelEdit = () => {
        setProfile(initialProfile);
        setIsEditing(false);
    };

    // פונקציות לטיפול בשינויים בעריכה
    const handleChange = (field) => (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setProfile({ ...profile, [field]: value });
    };

    const handleDayChange = (day) => (e) => {
        const newDays = profile.arrivalDays || [];
        if (e.target.checked) {
            setProfile({ ...profile, arrivalDays: [...newDays, day] });
        } else {
            setProfile({
                ...profile,
                arrivalDays: newDays.filter((d) => d !== day),
            });
        }
    };

    function calculateAge(birthDateStr) {
        if (!birthDateStr) return "";
        const today = new Date();
        const birthDate = new Date(birthDateStr);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            dir="rtl"
            maxWidth="md"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    width: '500px',
                    height: 'auto',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                    alt={profile.name}
                    src={profile.imageUrl || ""}
                    sx={{ width: 130, height: 130 }}
                >
                    {(!profile.imageUrl && profile.name) ? profile.name[0] : ""}
                </Avatar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {profile.name}
                </Typography>
                <IconButton
                    aria-label="סגור"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        left: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {!isEditing ? (
                    <>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">תעודת זהות: </Box>
                            <Box component="span">{profile.id}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">גיל: </Box>
                            <Box component="span">{calculateAge(profile.birthDate)}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">תאריך לידה: </Box>
                            <Box component="span">{profile.birthDate}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">מין: </Box>
                            <Box component="span">{profile.gender}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">טלפון: </Box>
                            <Box component="span">{profile.phone}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">טלפון נוסף: </Box>
                            <Box component="span">{profile.phone2}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">מייל: </Box>
                            <Box component="span">{profile.email}</Box>
                        </Typography>

                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">כתובת: </Box>
                            <Box component="span">{profile.address}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">יישוב: </Box>
                            <Box component="span">{profile.city}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">ימי הגעה: </Box>
                            <Box component="span">{profile.arrivalDays?.join(", ") || "לא צוינו"}</Box>
                        </Typography>
                        
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">הסעה: </Box>
                            <Box component="span">{profile.transport}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">משובץ להסעה: </Box>
                            <Box
                                component="span"
                                sx={{
                                    color: transportDetails ? 'text.primary' : 'error.main',
                                    fontWeight: transportDetails ? 'normal' : 'medium'
                                }}
                            >
                                {transportDetails
                                    ? `מספר ${transportDetails.serialNumber} (${transportDetails.cities.join(' -> ')})`
                                    : "נדרש לשבץ להסעה"}
                            </Box>
                        </Typography>
                        
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">מטפל: </Box>
                            <Box component="span">{profile.hasCaregiver ? "כן" : "לא"}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">ניצול שואה: </Box>
                            <Box component="span">{profile.isHolocaustSurvivor ? "כן" : "לא"}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">רמת תפקוד: </Box>
                            <Box component="span">{profile.functionLevel}</Box>
                        </Typography>
                        
                        
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">זכאות: </Box>
                            <Box component="span">{profile.eligibility}</Box>
                        </Typography>
                        {profile.eligibility === "סיעוד" && (
                            <Typography sx={{ my: 0 }}>
                                <Box component="span" fontWeight="bold" fontSize="1.1rem">חברת סיעוד: </Box>
                                <Box component="span">{profile.nursingCompany || "לא צויין"}</Box>
                            </Typography>
                        )}
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">חבר ב-: </Box>
                            <Box component="span">{profile.membership}</Box>
                        </Typography>
                        

                        <Box mt={2}>
                            <Button
                                onClick={() => setIsEditing(true)}
                                sx={{ ml: 2 }}
                                variant="outlined"
                            >
                                ערוך
                            </Button>

                            <Button
                                onClick={handleDelete}
                                color="error"
                                variant="outlined"
                                sx={{ ml: 2 }}
                            >
                                מחק
                            </Button>
                        </Box>
                    </>
                ) : (
                    <EditProfileWindow
                        profile={profile}
                        handleChange={handleChange}
                        handleDayChange={handleDayChange}
                        handleCancelEdit={handleCancelEdit}
                        handleSave={() => handleSave(profile)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

export default ProfileWindow;