import { useState, useEffect } from "react";
import { removePassengerFromTransports, getPassengerTransport } from "../../utils/transportUtils";
import {
    Dialog, DialogTitle, DialogContent, Typography, Button, Box, Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import EditIcon from '@mui/icons-material/Edit';
import EditProfileWindow from "./EditProfileWindow";
import dayjs from "dayjs";
import CustomDialog from '../CustomDialog';

const dayMap = {
    'ראשון': 'א',
    'שני': 'ב',
    'שלישי': 'ג',
    'רביעי': 'ד',
    'חמישי': 'ה',
};

const arrivalDaysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

function ProfileWindow({ open, onClose, profile: initialProfile, onSave, onDelete }) {
    if (!initialProfile) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(initialProfile || {});
    const [transportDetails, setTransportDetails] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Update profile and transport when initialProfile changes
    useEffect(() => {
        if (initialProfile) {
            setProfile(initialProfile);
            // Fetch the transport details of the passenger
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
            // First, remove the passenger from all transports
            await removePassengerFromTransports(profile.id);
            // Then, delete the profile
            await onDelete(profile.id);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error deleting profile:', error);
            alert('שגיאה במחיקת הפרופיל');
        }
    };

    // Function to save changes
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

    // Function to cancel editing
    const handleCancelEdit = () => {
        setProfile(initialProfile);
        setIsEditing(false);
    };

    // Functions to handle editing changes
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

    const sortedArrivalDays = (profile.arrivalDays || []).slice().sort((a, b) => arrivalDaysOrder.indexOf(a) - arrivalDaysOrder.indexOf(b));

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
                <Box sx={{
                    display: 'flex', gap: 2, position: 'absolute', right: 16, top: 16,
                    mt: 1
                }}>
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="outlined"
                        size="small"
                        sx={{
                            border: '1.7px solid rgba(64, 99, 112, 0.72)',
                            color: 'rgba(64, 99, 112, 0.72)',
                            fontWeight: 'bold',
                            ':hover': { borderColor: '#7b8f99', color: '#5a676e', outline: 'none' },
                            '&:focus': { outline: 'none' },
                            '&:active': { outline: 'none' },
                            minWidth: 'auto',
                        }}
                        startIcon={<EditIcon sx={{ fontSize: '0.9rem', ml: 0.5, mr: -1 }} />}
                    >
                        ערוך
                    </Button>

                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{
                            fontWeight: 'bold',
                            ':hover': { borderColor: '#7b8f99', color: '#5a676e', outline: 'none' },
                            '&:focus': { outline: 'none' },
                            '&:active': { outline: 'none' },
                            minWidth: 'auto',
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
                    src={profile.profileImage || ""}
                    sx={{
                        width: 170,
                        height: 170,
                        mt: 4
                    }}
                >
                    {(!profile.profileImage && profile.name) ? profile.name[0] : ""}
                </Avatar>
                <IconButton
                    aria-label="סגור"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        left: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        '&:hover': { backgroundColor: 'transparent', border: 'none', outline: 'none',
                            boxShadow: 'none', },
                        '&:focus': { border: 'none', outline: 'none', boxShadow: 'none', },
                        '&:active': { border: 'none', outline: 'none',  boxShadow: 'none', },
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
                                <Box component="span">{sortedArrivalDays.map(day => dayMap[day] || day).join(", ")}</Box>
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
            <CustomDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title="אישור מחיקה"
                dialogContentSx={{ mt: 2 }}
                actions={[
                    <Button
                        key="cancel"
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
                    </Button>,
                    <Button
                        key="confirm"
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
                ]}
            >
                <Typography variant="body1" sx={{
                    textAlign: 'right',
                    color: 'black',
                    fontSize: '1.1rem',
                    fontWeight: 500
                }}>
                    האם אתה בטוח שברצונך למחוק את {profile.name}?
                </Typography>
            </CustomDialog>
        </Dialog>
    );
}

export default ProfileWindow;