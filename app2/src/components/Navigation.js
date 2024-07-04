import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemText, IconButton } from '@mui/material';
import {Menu as MenuIcon} from '@mui/icons-material';

const Navigation = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div>
      <IconButton onClick={() => setIsDrawerOpen(true)}>
        <MenuIcon />
      </IconButton>
      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <List style={{backgroundColor: "#ccc"}}>
          <ListItem button='true' component={Link} to="/">
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem button='true' component={Link} to="/upload">
            <ListItemText primary="Load Data" />
          </ListItem>
          <ListItem button='true' component={Link} to="/analytics">
            <ListItemText primary="View Analytics" />
          </ListItem>
          <ListItem button='true' component={Link} to="/parameters">
            <ListItemText primary="Parameters" />
          </ListItem>
        </List>
      </Drawer>
    </div>
  );
};

export default Navigation;
