import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Typography 
} from "@mui/material";
import { useState } from "react";

function AddProfileWindow({ open, onClose, onSave }) {
    const [formData, setFormData] = useState({
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

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setErrors((prev) => ({ ...prev, [name]: false }));
    };

    const handleSubmit = () => {
        const requiredFields = ["name", "id", "city", "phone"];
        const newErrors = {};
        requiredFields.forEach((field) => {
            if (!formData[field]) newErrors[field] = true;
        });

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
        <Dialog open={open} onClose={onClose} dir="rtl">
            <DialogTitle>הוספת פרופיל חדש</DialogTitle>
            <DialogContent>

                <TextField
                    fullWidth label="שם" name="name"
                    value={formData.name} onChange={handleChange} margin="dense"
                    error={errors.name} helperText={errors.name && "שדה חובה"}
                />

                <TextField
                    fullWidth label="גיל" name="age"
                    value={formData.age} onChange={handleChange} margin="dense"
                />

                <TextField
                    fullWidth label="תעודת זהות" name="id"
                    value={formData.id} onChange={handleChange} margin="dense"
                    error={errors.id} helperText={errors.id && "שדה חובה"}
                />

                <TextField
                    fullWidth label="כתובת" name="address"
                    value={formData.address} onChange={handleChange} margin="dense"
                />

                <TextField
                    fullWidth label="יישוב" name="city"
                    value={formData.city} onChange={handleChange} margin="dense"
                    error={errors.city} helperText={errors.city && "שדה חובה"}
                />

                <TextField
                    fullWidth label="תאריך לידה" name="birthDate"
                    value={formData.birthDate} onChange={handleChange} margin="dense"
                />

                <TextField
                    fullWidth label="טלפון" name="phone"
                    value={formData.phone} onChange={handleChange} margin="dense"
                    error={errors.phone} helperText={errors.phone && "שדה חובה"}
                />

                <TextField
                    fullWidth label="אימייל" name="email"
                    value={formData.email} onChange={handleChange} margin="dense"
                />

                <FormControl fullWidth margin="dense">
                    <InputLabel>הסעה</InputLabel>
                    <Select
                        name="transport" value={formData.transport} onChange={handleChange}
                    >
                        <MenuItem value="מונית">מונית</MenuItem>
                        <MenuItem value="הסעה">הסעה</MenuItem>
                        <MenuItem value="אחר">אחר</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="dense">
                    <InputLabel>רמת תפקוד</InputLabel>
                    <Select
                        name="functionLevel" value={formData.functionLevel} onChange={handleChange}
                    >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <MenuItem key={n} value={n}>{n}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="dense">
                    <InputLabel>מין</InputLabel>
                    <Select
                        name="gender" value={formData.gender} onChange={handleChange}
                    >
                        <MenuItem value="זכר">זכר</MenuItem>
                        <MenuItem value="נקבה">נקבה</MenuItem>
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

                <FormControl fullWidth margin="dense">
                    <InputLabel>זכאות</InputLabel>
                    <Select
                        name="eligibility" value={formData.eligibility} onChange={handleChange}
                    >
                        <MenuItem value="רווחה">רווחה</MenuItem>
                        <MenuItem value="סיעוד">סיעוד</MenuItem>
                        <MenuItem value="אחר">אחר</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="dense">
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