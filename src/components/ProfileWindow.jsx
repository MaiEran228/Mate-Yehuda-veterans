import { useState } from "react";
import { deleteProfile } from "../firebase";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Button,
    TextField,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Box,
} from "@mui/material";

const GENDERS = ["זכר", "נקבה", "אחר"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

function ProfileWindow({ open, onClose, profile: initialProfile, onSave, onDelete }) {
    if (!initialProfile) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(initialProfile || {});

    const handleChange = (field) => (e) => {
        const value =
            e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setProfile({ ...profile, [field]: value });
    };

    const handleDelete = async () => {
        const confirm = window.confirm(`האם למחוק את ${profile.name}?`);
        if (confirm) {
            await onDelete(profile.id); // מחיקה דרך ההורה
        }
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

    const handleSave = () => {
        onSave(profile);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setProfile(initialProfile);
        setIsEditing(false);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            dir="rtl"
            maxWidth="md"        // אפשר גם "lg" אם את רוצה יותר רחב
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    width: '400px',     // רוחב מותאם אישית - שנו לפי הצורך
                    height: 'auto',     // או למשל '600px' אם את רוצה גם גובה קבוע
                    maxWidth: 'none',   // חשוב! כדי לא להגביל אותך ל-"sm/md/lg"
                }
            }}
        >            <DialogTitle>{profile.name}</DialogTitle>
            <DialogContent>
                {!isEditing ? (
                    <>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">שם: </Box>
                            <Box component="span">{profile.name}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">גיל: </Box>
                            <Box component="span">{profile.age}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">תעודת זהות: </Box>
                            <Box component="span">{profile.id}</Box>
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
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">תאריך לידה: </Box>
                            <Box component="span">{profile.birthDate}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">טלפון: </Box>
                            <Box component="span">{profile.phone}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">מייל: </Box>
                            <Box component="span">{profile.email}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">הסעה: </Box>
                            <Box component="span">{profile.transport}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">רמת תפקוד: </Box>
                            <Box component="span">{profile.functionLevel}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">מין: </Box>
                            <Box component="span">{profile.gender}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">ימי הגעה: </Box>
                            <Box component="span">{profile.arrivalDays?.join(", ") || "לא צוינו"}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">זכאות: </Box>
                            <Box component="span">{profile.eligibility}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">ניצול שואה: </Box>
                            <Box component="span">{profile.isHolocaustSurvivor ? "כן" : "לא"}</Box>
                        </Typography>
                        <Typography sx={{ my: 0 }}>
                            <Box component="span" fontWeight="bold" fontSize="1.1rem">מטפל: </Box>
                            <Box component="span">{profile.hasCaregiver ? "כן" : "לא"}</Box>
                        </Typography>
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

                            <Button onClick={onClose}>סגור</Button>
                        </Box>
                    </>
                ) : (
                    <>
                        <TextField
                            fullWidth
                            label="שם"
                            value={profile.name}
                            onChange={handleChange("name")}
                            sx={{ my: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="גיל"
                            type="number"
                            value={profile.age}
                            onChange={handleChange("age")}
                            sx={{ my: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="תעודת זהות"
                            value={profile.id}
                            onChange={handleChange("id")}
                            sx={{ my: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="כתובת"
                            value={profile.address}
                            onChange={handleChange("address")}
                            sx={{ my: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="יישוב"
                            value={profile.city}
                            onChange={handleChange("city")}
                            sx={{ my: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="תאריך לידה"
                            type="date"
                            value={profile.birthDate}
                            onChange={handleChange("birthDate")}
                            InputLabelProps={{ shrink: true }}
                            sx={{ my: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="טלפון"
                            value={profile.phone}
                            onChange={handleChange("phone")}
                            sx={{ my: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="מייל"
                            value={profile.email}
                            onChange={handleChange("email")}
                            sx={{ my: 1 }}
                        />

                        <TextField
                            select
                            fullWidth
                            label="מין"
                            value={profile.gender}
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
                            value={profile.transport}
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
                            value={profile.functionLevel}
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
                            value={profile.eligibility}
                            onChange={handleChange("eligibility")}
                            sx={{ my: 1 }}
                        >
                            <MenuItem value="רווחה">רווחה</MenuItem>
                            <MenuItem value="סיעוד">סיעוד</MenuItem>
                            <MenuItem value="אחר">אחר</MenuItem>
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="חבר ב-"
                            value={profile.membership}
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
                                    checked={profile.isHolocaustSurvivor}
                                    onChange={handleChange("isHolocaustSurvivor")}
                                />
                            }
                            label="ניצול שואה"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={profile.hasCaregiver}
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
                )}
            </DialogContent>
        </Dialog>
    );
}

export default ProfileWindow;