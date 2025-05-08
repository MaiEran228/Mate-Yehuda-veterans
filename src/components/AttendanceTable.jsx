import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    TextField,
    Paper,
    MenuItem
} from '@mui/material';
import { useState } from 'react';

const initialData = [
    { id: 1, name: 'דוד לוי', location: 'ירושלים', attended: false, reason: '' },
    { id: 2, name: 'שרה כהן', location: 'תל אביב', attended: false, reason: '' },
    { id: 3, name: 'משה יוספי', location: 'בית שמש', attended: false, reason: '' },
];

const reasonOptions = ['מחלה', 'אשפוז', 'שמחה', 'אבל'];

export default function AttendanceTable() {
    const [rows, setRows] = useState(initialData);

    const handleAttendanceChange = (id, checked) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id
                    ? { ...row, attended: checked, reason: checked ? '' : row.reason }
                    : row
            )
        );
    };

    const handleReasonChange = (id, value) => {
        setRows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, reason: value } : row))
        );
    };

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell align="right">שם</TableCell>
                        <TableCell align="right">אזור מגורים</TableCell>
                        <TableCell align="right">נוכח</TableCell>
                        <TableCell align="right">סיבה להעדר</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell align="right">{row.name}</TableCell>
                            <TableCell align="right">{row.location}</TableCell>
                            <TableCell align="right">
                                <Checkbox
                                    checked={row.attended}
                                    onChange={(e) => handleAttendanceChange(row.id, e.target.checked)}
                                />
                            </TableCell>
                            <TableCell align="right">
                                {!row.attended && (
                                    <TextField
                                        select
                                        label="סיבה להעדר"
                                        variant="standard"
                                        value={row.reason}
                                        onChange={(e) => handleReasonChange(row.id, e.target.value)}
                                        fullWidth
                                    >
                                        {reasonOptions.map((option) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}