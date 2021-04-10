'use strict';

import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {w3cwebsocket as W3CWebSocket} from 'websocket';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { Box, Chip, Divider, Grid, List, ListItem, TextField, Modal } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import CheckIcon from '@material-ui/icons/Check';
import WifiIcon from '@material-ui/icons/Wifi';
import WifiOffIcon from '@material-ui/icons/WifiOff';
import SettingsIcon from '@material-ui/icons/Settings';
import GitHubIcon from '@material-ui/icons/GitHub';

import {Room} from './room.js';
import {clientState} from './state.js';

import * as Msg from '../shared/messages.js';
import './style.css';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  useParams
} from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  menuButton: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1
  },
  source: {
    flexGrow: 1,
    marginRight: "0.75rem"
  }
}));

const App = () => {
  const classes = useStyles();
  return <>
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" className={classes.title}>
          Planning Poker
        </Typography>
        <Button href="https://github.com/mustlammas/planningpoker" target="_blank" color="inherit" size="small">
          <Typography variant="button" className={classes.source}> v{process.env.VERSION}</Typography><GitHubIcon/>
        </Button>
      </Toolbar>
    </AppBar>
    <Router>
      <Switch>
        <Route path="/room/:id">
          <Room/>
        </Route>
        <Route path="/">
          <CreateRoom/>
        </Route>
      </Switch>
    </Router>
  </>;
};

const CreateRoom = () => {
  const history = useHistory();

  const createRoom = () => {
    fetch(`${SERVER}/api/new`, {redirect: 'follow'})
     .then(res => res.json())
     .then(room => {
       history.push(`/room/${room.id}`);
     });
  };

  return <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justify="center"
      style={{ minHeight: '50vh'}}
      className="container">
      <Box ml={1} display="inline">
        <Button color="primary" variant="contained" size="large" onClick={createRoom}>Create room</Button>
      </Box>
    </Grid>;
};

ReactDOM.render(<App/>, document.getElementById('root'));
