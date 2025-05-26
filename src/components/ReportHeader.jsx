import { Typography } from '@mui/material';

const ReportHeader = ({ title }) => (
  <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
    {title}
  </Typography>
);

export default ReportHeader;