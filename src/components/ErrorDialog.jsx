import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, IconButton } from "@mui/material";

export default function CustomDialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "sm",
  fullWidth = true,
  dir = "rtl",
  dialogTitleSx = {},
  dialogContentSx = {},
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      dir={dir}
    >
      <DialogTitle
        sx={{
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #e0e0e0",
          ...dialogTitleSx,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {title}
        <IconButton
          aria-label="סגור"
          onClick={onClose}
          sx={{
            color: 'grey.600',
            ml: 1,
            '&:hover': { color: 'grey.800' },
            '&:focus': { outline: 'none' }
          }}
        >
          ×
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', ...dialogContentSx }}>
        {typeof children === "string" ? <Typography align="right" sx={{ width: '100%' }}>{children}</Typography> : children}
      </DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
} 