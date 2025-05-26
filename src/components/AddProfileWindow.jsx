import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControlLabel, Checkbox, MenuItem,
    Select, InputLabel, FormControl, Typography
} from "@mui/material";
import { useState, useEffect } from "react";

function AddProfileWindow({ open, onClose, onSave }) {
    const initialFormData = {
        name: "",
        age: "",
        id: "",
        address: "",
        city: "",
        birthDate: "",
        phone: "",
        email: "",
        transport: "",
        functionLevel: "",
        gender: "",
        arrivalDays: [],
        eligibility: "",
        isHolocaustSurvivor: false,
        hasCaregiver: false,
        membership: "",
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
        setErrors((prev) => ({ ...prev, [name]: false }));
    };
    const isValidPhoneNumber = (phone) => {
        // בודק שהטלפון מכיל רק ספרות
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
        const requiredFields = ["name", "id", "city", "birthDate"];
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

        const newProfile = {
            ...formData,

        };
        onSave(newProfile);
        setFormData({
            name: "",
            age: "",
            id: "",
            address: "",
            city: "",
            birthDate: "",
            phone: "",
            email: "",
            transport: "",
            functionLevel: "",
            gender: "",
            arrivalDays: [],
            eligibility: "",
            isHolocaustSurvivor: false,
            hasCaregiver: false,
            membership: "",
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} dir="rtl" >
            <DialogTitle>הוספת פרופיל חדש</DialogTitle>
            <DialogContent>

                <TextField
                    fullWidth label="שם" name="name" sx={{ maxWidth: "170px", ml: 1 }}
                    value={formData.name} onChange={handleChange} margin="dense"
                    error={errors.name} helperText={errors.name && "שדה חובה"}
                />

                <TextField
                    fullWidth label="תעודת זהות" name="id" sx={{ maxWidth: "170px", ml: 1 }}
                    value={formData.id} onChange={handleChange} margin="dense"
                    error={errors.id} helperText={errors.id && "שדה חובה"}
                />

                <TextField
                    fullWidth
                    label="תאריך לידה"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    sx={{ maxWidth: "170px" }}
                    margin="dense"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    error={!!errors?.birthDate}
                    helperText={errors?.birthDate && "שדה חובה"}
                />

                <FormControl fullWidth margin="dense" sx={{ maxWidth: "170px", ml: 1 }}>
                    <InputLabel>מין</InputLabel>
                    <Select
                        name="gender" value={formData.gender} onChange={handleChange}
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
                    sx={{ maxWidth: "170px", ml: 1 }}
                    value={formData.phone}
                    onChange={handleChange}
                    margin="dense"
                    error={!!errors.phone}
                    helperText={errors.phone || ""}
                />

                <TextField
                    fullWidth label="אימייל" name="email" sx={{ maxWidth: "170px", ml: 1 }}
                    value={formData.email} onChange={handleChange} margin="dense"
                />

                <TextField
                    fullWidth label="כתובת" name="address" sx={{ maxWidth: "170px", ml: 1 }}
                    value={formData.address} onChange={handleChange} margin="dense"
                />

                <TextField
                    fullWidth label="יישוב" name="city" sx={{ maxWidth: "170px", ml: 1 }}
                    value={formData.city} onChange={handleChange} margin="dense"
                    error={errors.city} helperText={errors.city && "שדה חובה"}
                />



                <FormControl fullWidth margin="dense" sx={{ maxWidth: "170px", ml: 1 }}>
                    <InputLabel>הסעה</InputLabel>
                    <Select
                        name="transport" value={formData.transport} onChange={handleChange}
                    >
                        <MenuItem value="מונית">מונית</MenuItem>
                        <MenuItem value="הסעה">הסעה</MenuItem>
                        <MenuItem value="אחר">אחר</MenuItem>
                    </Select>
                </FormControl>

                <Typography variant="subtitle1" sx={{ mt: 2 }}>ימי הגעה</Typography>
                <FormControl component="fieldset" sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
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
                </FormControl>

                <FormControl fullWidth margin="dense" sx={{ maxWidth: "170px", ml: 1 }}>
                    <InputLabel>רמת תפקוד</InputLabel>
                    <Select
                        name="functionLevel" value={formData.functionLevel} onChange={handleChange}
                    >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <MenuItem key={n} value={n}>{n}</MenuItem>
                        ))}
                    </Select>
                </FormControl>




                <FormControl fullWidth margin="dense" sx={{ maxWidth: "170px", ml: 1 }}>
                    <InputLabel>זכאות</InputLabel>
                    <Select
                        name="eligibility" value={formData.eligibility} onChange={handleChange}
                    >
                        <MenuItem value="רווחה">רווחה</MenuItem>
                        <MenuItem value="סיעוד">סיעוד</MenuItem>
                        <MenuItem value="אחר">אחר</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="dense" sx={{ maxWidth: "170px", ml: 1 }}>
                    <InputLabel>חבר ב־</InputLabel>
                    <Select
                        name="membership" value={formData.membership} onChange={handleChange}
                    >
                        <MenuItem value="קהילה תומכת">קהילה תומכת</MenuItem>
                        <MenuItem value="מרכז יום">מרכז יום</MenuItem>
                        <MenuItem value="אחר">אחר</MenuItem>
                    </Select>
                </FormControl>

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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>ביטול</Button>
                <Button onClick={handleSubmit} variant="contained">שמור</Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddProfileWindow;