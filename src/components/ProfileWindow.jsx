import { useState, useEffect } from "react";
import { deleteProfile } from "../firebase";
import { removePassengerFromTransports, getPassengerTransport } from "../utils/transportUtils";
import {
    Dialog, DialogTitle, DialogContent, Typography, Button, TextField, MenuItem, Checkbox, FormControlLabel,
    Box, Avatar, DialogActions
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import EditIcon from '@mui/icons-material/Edit';
import EditProfileWindow from "./EditProfileWindow";
import dayjs from "dayjs";

const GENDERS = ["זכר", "נקבה", "אחר"];
const DAYS = ["'א", "'ב", "'ג", "'ד", "'ה"];

const dayMap = {
  'ראשון': 'א',
  'שני': 'ב',
  'שלישי': 'ג',
  'רביעי': 'ד',
  'חמישי': 'ה',
};

function ProfileWindow({ open, onClose, profile: initialProfile, onSave, onDelete }) {
    if (!initialProfile) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(initialProfile || {});
    const [transportDetails, setTransportDetails] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            // קודם מוחקים את הנוסע מכל ההסעות
            await removePassengerFromTransports(profile.id);
            // אחר כך מוחקים את הפרופיל
            await onDelete(profile.id);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error deleting profile:', error);
            alert('שגיאה במחיקת הפרופיל');
        }
    };

    // פונקציה לשמירת שינויים
    const handleSave = async (updatedProfile) => {
        try {
            if (onSave) {
                await onSave(updatedProfile);
            }
            setIsEditing(false);
            onClose(); // Close the window after successful save
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
                <Box sx={{ display: 'flex', gap: 2, position: 'absolute', right: 16, top: 16, 
                    mt: 1
                }}>
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="outlined"
                        size="small"
                        sx={{ 
                            minWidth: '30px',
                            height: '25px',
                            fontSize: '0.8rem',
                            padding: '4px 0px 4px 14px'
                        }}
                        startIcon={<EditIcon sx={{ fontSize: '0.9rem', ml: 1 }} />}
                    >
                        ערוך
                    </Button>

                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{ 
                            minWidth: '50px',
                            height: '25px',
                            fontSize: '0.8rem',
                            padding: '4px 8px'
                            
                        }}
                    >
                        מחק
                    </Button>
                </Box>
                <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                        flexGrow: 1,
                        fontWeight: 'bold',
                        fontSize: '2rem',
                        mb: 2,
                        mt: 0
                    }}
                >
                    {profile.name}
                </Typography>
                <Avatar
                    alt={profile.name}
                    src={profile.imageUrl || ""}
                    sx={{ 
                        width: 130, 
                        height: 130,
                        mt: 4
                    }}
                >
                    {(!profile.imageUrl && profile.name) ? profile.name[0] : ""}
                </Avatar>
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
            <DialogContent dir="ltr" sx={{ mt: -8 }}>
                <Box sx={{ direction: 'rtl' }}>
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
                                <Box component="span">{dayjs(profile.birthDate).format('DD/MM/YYYY')}</Box>
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
                                <Box component="span">{profile.arrivalDays && profile.arrivalDays.length > 0 ? profile.arrivalDays.map(day => dayMap[day] || day).join(", ") : "לא צוינו"}</Box>
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
                                        color: (profile.isPrivateTransport || profile.transport === 'פרטי') ? 'text.primary' : (transportDetails ? 'text.primary' : 'error.main'),
                                        fontWeight: (profile.isPrivateTransport || profile.transport === 'פרטי') ? 'normal' : (transportDetails ? 'normal' : 'medium')
                                    }}
                                >
                                    {(profile.isPrivateTransport || profile.transport === 'פרטי')
                                        ? "לא נדרשת הסעה"
                                        : (transportDetails
                                            ? `מספר ${transportDetails.serialNumber} (${transportDetails.cities.join(' -> ')})`
                                            : "נדרש לשבץ להסעה")}
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
                </Box>
            </DialogContent>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                dir="rtl"
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                    }
                }}
            >
                <DialogTitle sx={{
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    py: 2
                }}>
                    אישור מחיקה
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body1" sx={{
                        textAlign: 'right',
                        color: 'black',
                        fontSize: '1.1rem',
                        fontWeight: 500
                    }}>
                        האם אתה בטוח שברצונך למחוק את {profile.name}?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{
                    borderTop: '1px solid #e0e0e0',
                    p: 2,
                    justifyContent: 'flex-end'
                }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        variant="outlined"
                        sx={{
                            borderColor: 'white',
                            color: 'black',
                            '&:hover': {
                                borderColor: 'black',
                                color: 'black'
                            },
                            minWidth: '100px'
                        }}
                    >
                        ביטול
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        sx={{
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#aa2424'
                            },
                            minWidth: '100px'
                        }}
                    >
                        אישור
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
}

export default ProfileWindow;