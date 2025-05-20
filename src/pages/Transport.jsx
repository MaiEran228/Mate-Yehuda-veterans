import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const initialData = [
  {
    day: 'ראשון',
    city: 'תל אביב',
    seats: 4,
    contact: 'דני',
    type: 'מיניבוס',
    passengers: ['ישראל ישראלי', 'שרה כהן', 'מוטי לוי'],
  },
  {
    day: 'שני',
    city: 'חיפה',
    seats: 2,
    contact: 'רונית',
    type: 'מונית',
    passengers: ['לאה בן דוד'],
  },
];

const daysOfWeek = ['א', 'ב', 'ג', 'ד', 'ה'];
const transportTypes = ['מיניבוס', 'מונית'];

const TransportTable = () => {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [openDialog, setOpenDialog] = useState(false);
  const [newRide, setNewRide] = useState({
    day: '',
    city: '',
    seats: '',
    contact: '',
    type: '',
    passengers: [],
  });

  const [passengerDialog, setPassengerDialog] = useState({
    open: false,
    passengers: [],
  });

  const handleAddRide = () => {
    setData((prev) => [...prev, newRide]);
    setOpenDialog(false);
    setNewRide({ day: '', city: '', seats: '', contact: '', type: '', passengers: [] });
  };

  const filteredData = [...data]
    .filter((row) =>
      row.city.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const [editDialog, setEditDialog] = useState({ open: false, index: null, values: {} });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, index: null });

  const handleEditClick = (index) => {
    setEditDialog({ open: true, index, values: { ...data[index] } });
  };

  const handleDeleteClick = (index) => {
    setDeleteDialog({ open: true, index });
  };

  const handleSaveEdit = () => {
    const updated = [...data];
    updated[editDialog.index] = editDialog.values;
    setData(updated);
    setEditDialog({ open: false, index: null, values: {} });
  };

  const handleConfirmDelete = () => {
    const updated = data.filter((_, i) => i !== deleteDialog.index);
    setData(updated);
    setDeleteDialog({ open: false, index: null });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        רשימת הסעות
      </Typography>

      {/* 🔘 חיפוש + מיון + כפתור הוספה */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          padding: 2,
          borderRadius: 2,
        }}
      >
        <TextField
          label="חיפוש לפי יישוב"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>מיון לפי</InputLabel>
          <Select
            value={sortField}
            label="מיון לפי"
            onChange={(e) => setSortField(e.target.value)}
          >
            <MenuItem value="">ללא מיון</MenuItem>
            <MenuItem value="day">יום</MenuItem>
            <MenuItem value="city">יישוב</MenuItem>
            <MenuItem value="seats">מקומות פנויים</MenuItem>
            <MenuItem value="type">סוג הסעה</MenuItem>
          </Select>
        </FormControl>


        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
        >
          הוספת הסעה
        </Button>
      </Box>

      {/* 📋 טבלה בגלילה */}
      <Box
        sx={{
          overflow: 'auto',
          maxHeight: '70vh',
          backgroundColor: '#fff',
          borderRadius: 2,
          boxShadow: 1,
          padding: 2,

        }}
      >
        <Table sx={{ width: '800px', tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>יום</TableCell>
              <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>יישובים</TableCell>
              <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>מקומות פנויים</TableCell>
              <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>סוג הסעה</TableCell>
              <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>צפייה</TableCell>
              <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>פעולה</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow key={index}>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{row.day}</TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{row.city}</TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{row.seats}</TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{row.type}</TableCell>

                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Tooltip title="צפייה באנשים">
                    <IconButton onClick={() => setPassengerDialog({ open: true, passengers: row.passengers })}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>

                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="עריכה">
                      <IconButton onClick={() => handleEditClick(index)}>
                        <EditIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="מחק">
                      <IconButton onClick={() => handleDeleteClick(index)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, index: null, values: {} })}>
        <DialogTitle>עריכת הסעה</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <FormControl fullWidth>
            <InputLabel>יום</InputLabel>
            <Select
              value={editDialog.values.day || ''}
              label="יום"
              onChange={(e) =>
                setEditDialog((prev) => ({
                  ...prev,
                  values: { ...prev.values, day: e.target.value },
                }))
              }
            >
              {daysOfWeek.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="יישוב"
            value={editDialog.values.city || ''}
            onChange={(e) =>
              setEditDialog((prev) => ({
                ...prev,
                values: { ...prev.values, city: e.target.value },
              }))
            }
          />

          <TextField
            label="מקומות פנויים"
            type="number"
            value={editDialog.values.seats || ''}
            onChange={(e) =>
              setEditDialog((prev) => ({
                ...prev,
                values: { ...prev.values, seats: e.target.value },
              }))
            }
          />

          <TextField
            label="איש קשר"
            value={editDialog.values.contact || ''}
            onChange={(e) =>
              setEditDialog((prev) => ({
                ...prev,
                values: { ...prev.values, contact: e.target.value },
              }))
            }
          />

          <FormControl fullWidth>
            <InputLabel>סוג הסעה</InputLabel>
            <Select
              value={editDialog.values.type || ''}
              label="סוג הסעה"
              onChange={(e) =>
                setEditDialog((prev) => ({
                  ...prev,
                  values: { ...prev.values, type: e.target.value },
                }))
              }
            >
              {transportTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, index: null, values: {} })}>
            ביטול
          </Button>
          <Button onClick={handleSaveEdit} variant="contained">
            שמור
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, index: null })}>
        <DialogTitle>מחיקת הסעה</DialogTitle>
        <DialogContent>
          <Typography>האם את בטוחה שברצונך למחוק את ההסעה?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, index: null })}>ביטול</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">מחק</Button>
        </DialogActions>
      </Dialog>

      {/* 👁️ דיאלוג נוסעים */}
      <Dialog
        open={passengerDialog.open}
        onClose={() => setPassengerDialog({ open: false, passengers: [] })}
      >
        <DialogTitle>רשימת הוותיקים להסעה</DialogTitle>
        <DialogContent>
          <List sx={{ direction: 'rtl' }}>
            {passengerDialog.passengers.map((name, idx) => (
              <ListItem key={idx}>
                <ListItemText
                  primary={`${idx + 1}. ${name}`}
                  sx={{ textAlign: 'right' }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPassengerDialog({ open: false, passengers: [] })}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>

      {/* ➕ דיאלוג הוספת הסעה */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            p: 3,
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>הוספת הסעה חדשה</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <FormControl fullWidth>
            <InputLabel>יום</InputLabel>
            <Select
              value={newRide.day}
              label="יום"
              onChange={(e) =>
                setNewRide((prev) => ({ ...prev, day: e.target.value }))
              }
            >
              {daysOfWeek.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="יישוב"
            value={newRide.city}
            onChange={(e) =>
              setNewRide((prev) => ({ ...prev, city: e.target.value }))
            }
          />

          <TextField
            label="מקומות פנויים"
            type="number"
            value={newRide.seats}
            onChange={(e) =>
              setNewRide((prev) => ({ ...prev, seats: e.target.value }))
            }
          />

          <TextField
            label="איש קשר"
            value={newRide.contact}
            onChange={(e) =>
              setNewRide((prev) => ({ ...prev, contact: e.target.value }))
            }
          />

          <FormControl fullWidth>
            <InputLabel>סוג הסעה</InputLabel>
            <Select
              value={newRide.type}
              label="סוג הסעה"
              onChange={(e) =>
                setNewRide((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              {transportTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
          <Button onClick={handleAddRide} variant="contained">
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransportTable;