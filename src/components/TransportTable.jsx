import React, { useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Select, MenuItem, InputLabel, FormControl,
  Button, IconButton, Tooltip, Chip, Stack,
  Popover, Typography
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { calculateAvailableSeatsByDay } from '../utils/transportUtils';

function TransportTable({ 
  data, 
  searchTerm,
  sortField,
  onViewPassengers,
  onEditClick,
  onDeleteClick 
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);

  const handleSeatsClick = (event, transport) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransport(transport);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedTransport(null);
  };

  const open = Boolean(anchorEl);

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
    <Box sx={{
      backgroundColor: '#fff',
      borderRadius: 2,
      boxShadow: 1,
      overflow: 'hidden'
    }}>
      <Table sx={{ minWidth: '800px', tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', width: '60px' }}>מס׳</TableCell>
            <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>ימים</TableCell>
            <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>יישובים</TableCell>
            <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>מקומות פנויים</TableCell>
            <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>סוג הסעה</TableCell>
            <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>צפייה</TableCell>
            <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>פעולה</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((row, index) => {
            const availableSeatsByDay = calculateAvailableSeatsByDay(row.type, row.passengers, row.days);
            const hasAvailableSeats = Object.values(availableSeatsByDay).some(seats => seats > 0);

            return (
              <TableRow key={index}>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  {index + 1}
                </TableCell>
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
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Tooltip title="לחץ לפירוט מקומות פנויים">
                    <IconButton onClick={(e) => handleSeatsClick(e, row)}>
                      <EventSeatIcon sx={{ 
                        color: hasAvailableSeats ? 'success.main' : 'error.main',
                        fontSize: 20
                      }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{row.type}</TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Tooltip title="צפייה באנשים">
                    <IconButton onClick={() => onViewPassengers(row.passengers || [], row.days || [])}>
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
            );
          })}
        </TableBody>
      </Table>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
            מקומות פנויים לפי יום:
          </Typography>
          {selectedTransport && selectedTransport.days?.map((day) => {
            const seats = calculateAvailableSeatsByDay(
              selectedTransport.type,
              selectedTransport.passengers,
              [day]
            )[day];
            return (
              <Typography key={day} sx={{ mb: 0.5 }}>
                {day}: {seats} מקומות פנויים
              </Typography>
            );
          })}
        </Box>
      </Popover>
    </Box>
  );
}

export default TransportTable; 