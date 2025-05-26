import React, { useEffect, useState } from 'react';
import { fetchAttendanceByDate } from '../../firebase';
import {
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import dayjs from 'dayjs';

const DailyAttendance = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      const data = await fetchAttendanceByDate(today);
      setAttendanceData(data);
      setLoading(false);
    };

    loadAttendance();
  }, [today]);

  if (loading) return <CircularProgress />;
  if (!attendanceData || !attendanceData.attendanceList) {
    return <Typography>אין נתוני נוכחות להיום ({today})</Typography>;
  }

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h5" gutterBottom>
        דו"ח נוכחות ליום {today}
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>שם</TableCell>
            <TableCell>נוכח</TableCell>
            <TableCell>מטפל</TableCell>
            <TableCell>סיבת היעדרות</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {attendanceData.attendanceList.map((person, idx) => (
            <TableRow key={idx}>
              <TableCell>{person.name || '-'}</TableCell>
              <TableCell>{person.attended ? 'כן' : 'לא'}</TableCell>
              <TableCell>
                {person.attended
                  ? person.caregiver
                    ? 'כן'
                    : ' '
                  : '-'}
              </TableCell>
              <TableCell>
                {!person.attended ? person.reason || '-' : '-'}
              </TableCell>
              
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default DailyAttendance;