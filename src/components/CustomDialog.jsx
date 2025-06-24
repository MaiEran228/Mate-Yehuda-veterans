import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from "@mui/material";

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
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent sx={dialogContentSx}>
        {typeof children === "string" ? <Typography>{children}</Typography> : children}
      </DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
} 