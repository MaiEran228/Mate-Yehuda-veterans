import React from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Select, MenuItem, InputLabel, FormControl,
  Button, IconButton, Tooltip, Chip, Stack
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function TransportTable({ 
  data, 
  searchTerm, 
  setSearchTerm, 
  sortField, 
  setSortField, 
  onAddClick, 
  onViewPassengers,
  onEditClick,
  onDeleteClick 
}) {
  const filteredData = [...data]
    .filter((row) =>
      (row.cities || []).some(city => 
        city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      if (sortField === 'days') {
        return (a.days?.[0] || '') < (b.days?.[0] || '') ? -1 : (a.days?.[0] || '') > (b.days?.[0] || '') ? 1 : 0;
      }
      if (sortField === 'cities') {
        return (a.cities?.[0] || '') < (b.cities?.[0] || '') ? -1 : (a.cities?.[0] || '') > (b.cities?.[0] || '') ? 1 : 0;
      }
      if ((a[sortField] || '') < (b[sortField] || '')) return -1;
      if ((a[sortField] || '') > (b[sortField] || '')) return 1;
      return 0;
    });

  return (
    <>
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
            <MenuItem value="days">ימים</MenuItem>
            <MenuItem value="cities">יישובים</MenuItem>
            <MenuItem value="seats">מקומות פנויים</MenuItem>
            <MenuItem value="type">סוג הסעה</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={onAddClick}
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
        <Table sx={{ minWidth: '800px', tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>ימים</TableCell>
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
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                    {(row.days || []).map((day, i) => (
                      <Chip key={i} label={day} size="small" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                    {(row.cities || []).map((city, i) => (
                      <Chip key={i} label={city} size="small" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{row.seats}</TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{row.type}</TableCell>

                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Tooltip title="צפייה באנשים">
                    <IconButton onClick={() => onViewPassengers(row.passengers || [])}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>

                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="עריכה">
                      <IconButton onClick={() => onEditClick(index)}>
                        <EditIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="מחק">
                      <IconButton onClick={() => onDeleteClick(index)}>
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
    </>
  );
}

export default TransportTable; 