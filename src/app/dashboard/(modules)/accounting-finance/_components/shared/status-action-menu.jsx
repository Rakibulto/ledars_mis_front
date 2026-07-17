'use client';

import { useState } from 'react';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CircularProgress from '@mui/material/CircularProgress';

export default function StatusActionMenu({ currentStatus, transitions, onTransition, loading }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton
        size="small"
        color="inherit"
        onClick={handleOpen}
        disabled={loading || !transitions?.length}
        aria-label={`Status actions for ${currentStatus}`}
      >
        {loading ? <CircularProgress size={18} /> : <MoreVertIcon fontSize="small" />}
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {transitions.map((transition) => (
          <MenuItem
            key={transition.status}
            onClick={async () => {
              handleClose();
              await onTransition?.(transition.status, transition);
            }}
            disabled={loading}
            sx={transition.destructive ? { color: 'error.main' } : undefined}
          >
            {transition.icon ? <ListItemIcon>{transition.icon}</ListItemIcon> : null}
            <ListItemText primary={transition.label} secondary={transition.helper} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
