import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

const ReportTable = ({ data }) => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>שם</TableCell>
        <TableCell>תאריך</TableCell>
        <TableCell>סטטוס</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map((row, index) => (
        <TableRow key={index}>
          <TableCell>{row.name}</TableCell>
          <TableCell>{row.date}</TableCell>
          <TableCell>{row.status}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default ReportTable;
