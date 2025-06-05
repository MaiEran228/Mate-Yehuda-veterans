import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControlLabel, Checkbox, MenuItem,
    Select, InputLabel, FormControl, Typography, Box
} from "@mui/material";
import { useState, useEffect } from "react";

function AddProfileWindow({ open, onClose, onSave }) {
    const initialFormData = {
        name: "", age: "", id: "", address: "", city: "", birthDate: "", phone: "", phone2:"", email: "",
        transport: "", functionLevel: "", gender: "", arrivalDays: [], eligibility: "", isHolocaustSurvivor: false,
        hasCaregiver: false, membership: "", nursingCompany: "",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            setFormData(initialFormData);
            setErrors({});
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        if (name === "eligibility" && value !== "סיעוד") {
            setFormData((prev) => ({ ...prev, nursingCompany: "" }));
        }
        setErrors((prev) => ({ ...prev, [name]: false }));
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

    const handleSubmit = () => {
        const requiredFields = ["name", "id", "city", "birthDate", "phone"];
        const newErrors = {};
        requiredFields.forEach((field) => {
            if (!formData[field]) newErrors[field] = true;
        });

        if (formData.phone && !isValidPhoneNumber(formData.phone)) {
            newErrors.phone = "מספר טלפון לא תקין";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave(formData);
        setFormData(initialFormData);
        setErrors({});
        onClose();
    };

    return (
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
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    {/* שדות טקסט */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="שם"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            error={errors.name}
                            helperText={errors.name && "שדה חובה"}
                            sx={{ maxWidth: "170px" }}
                        />

                        <TextField
                            fullWidth
                            label="תעודת זהות"
                            name="id"
                            value={formData.id}
                            onChange={handleChange}
                            required
                            error={errors.id}
                            helperText={errors.id && "שדה חובה"}
                            sx={{ maxWidth: "170px" }}
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
                            InputLabelProps={{ shrink: true }}
                            sx={{ maxWidth: "170px" }}
                        />

                        <FormControl fullWidth sx={{ maxWidth: "170px" }}>
                            <InputLabel>מין</InputLabel>
                            <Select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <MenuItem value="זכר">זכר</MenuItem>
                                <MenuItem value="נקבה">נקבה</MenuItem>
                                <MenuItem value="אחר">אחר</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="טלפון"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            error={!!errors.phone}
                            helperText={errors.phone === true ? "שדה חובה" : errors.phone}
                            sx={{ maxWidth: "170px" }}
                        />

                        <TextField
                            fullWidth
                            label="טלפון נוסף"
                            name="phone2"
                            value={formData.phone2}
                            onChange={handleChange}
                            sx={{ maxWidth: "170px" }}
                        />

                        <TextField
                            fullWidth
                            label="מייל"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            sx={{ maxWidth: "170px" }}
                        />

                        <TextField
                            fullWidth
                            label="כתובת"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            sx={{ maxWidth: "170px" }}
                        />

                        <TextField
                            fullWidth
                            label="יישוב"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            error={errors.city}
                            helperText={errors.city && "שדה חובה"}
                            sx={{ maxWidth: "170px" }}
                        />

                        <FormControl fullWidth sx={{ maxWidth: "170px" }}>
                            <InputLabel>הסעה</InputLabel>
                            <Select
                                name="transport"
                                value={formData.transport}
                                onChange={handleChange}
                            >
                                <MenuItem value="מונית">מונית</MenuItem>
                                <MenuItem value="הסעה">הסעה</MenuItem>
                                <MenuItem value="אחר">אחר</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* ימי הגעה בשורה נפרדת */}
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 0, whiteSpace: 'nowrap' }}>ימי הגעה:</Typography>
                            {["ראשון", "שני", "שלישי", "רביעי", "חמישי"].map((day) => (
                                <FormControlLabel
                                    key={day}
                                    control={
                                        <Checkbox
                                            checked={formData.arrivalDays.includes(day)}
                                            onChange={() => {
                                                setFormData((prev) => {
                                                    const isSelected = prev.arrivalDays.includes(day);
                                                    const newDays = isSelected
                                                        ? prev.arrivalDays.filter((d) => d !== day)
                                                        : [...prev.arrivalDays, day];
                                                    return { ...prev, arrivalDays: newDays };
                                                });
                                            }}
                                        />
                                    }
                                    label={day}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* שדות נוספים */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <FormControl fullWidth sx={{ maxWidth: "170px" }}>
                            <InputLabel>רמת תפקוד</InputLabel>
                            <Select
                                name="functionLevel"
                                value={formData.functionLevel}
                                onChange={handleChange}
                            >
                                {[1, 2, 3, 4, 5, 6].map((n) => (
                                    <MenuItem key={n} value={n}>{n}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ maxWidth: "170px" }}>
                            <InputLabel>זכאות</InputLabel>
                            <Select
                                name="eligibility"
                                value={formData.eligibility}
                                onChange={handleChange}
                            >
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
                            <InputLabel>חברת סיעוד</InputLabel>
                            <Select
                                name="nursingCompany"
                                value={formData.nursingCompany}
                                onChange={handleChange}
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
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ maxWidth: "170px" }}>
                            <InputLabel>חבר ב־</InputLabel>
                            <Select
                                name="membership"
                                value={formData.membership}
                                onChange={handleChange}
                            >
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
                <Button onClick={handleSubmit} variant="contained">שמור</Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddProfileWindow;