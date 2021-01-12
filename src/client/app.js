'use strict';

import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {w3cwebsocket as W3CWebSocket} from 'websocket';
import { Box, Button, Chip, Divider, Grid, List, ListItem, TextField, Modal } from '@material-ui/core';
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

const App = () => {
  return <Router>
    <Switch>
      <Route exact path="/">
        <CreateRoom/>
      </Route>
    </Switch>
    <Switch>
      <Route path="/:id">
        <Room/>
      </Route>
    </Switch>
  </Router>;
};

const CreateRoom = () => {
  const history = useHistory();

  const createRoom = () => {
    fetch(`${SERVER}/api/new`, {redirect: 'follow'})
     .then(res => res.json())
     .then(room => {
       history.push(`/${room.id}`);
     });
  };

  return <Box ml={1} display="inline">
    <Button color="primary" variant="contained" size="large" onClick={createRoom}>Create room</Button>
  </Box>
};


ReactDOM.render(<App/>, document.getElementById('root'));
