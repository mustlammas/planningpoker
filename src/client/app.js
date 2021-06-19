'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import {makeStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import {Box, Grid} from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import {RecoilRoot, useRecoilState} from 'recoil';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory,
} from "react-router-dom";

import {Room} from './room.js';
import './style.css';
import {ToastContainer} from "material-react-toastify";
import 'material-react-toastify/dist/ReactToastify.css';
import {ThemeProvider} from '@material-ui/styles';
import {darkTheme, defaultTheme} from "./themes";
import {uiModeState} from "./state";

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
  },
  themeToggle: {
    marginRight: "2rem"
  }
}));

const App = () => {
  return <RecoilRoot>
    <RecoiledApp/>
  </RecoilRoot>;
};

const RecoiledApp = () => {
  const [darkMode, setDarkMode] = useRecoilState(uiModeState);
  const classes = useStyles();
  const toggleUIMode = () => {
    setDarkMode(!darkMode);
  };

  return <ThemeProvider theme={darkMode ? darkTheme : defaultTheme}>
    <Box bgcolor="alternative.main" height="100vh">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            Planning Poker
          </Typography>
          <Button color="default" size="small" variant="contained" className={classes.themeToggle}
                  onClick={toggleUIMode}>
            {darkMode ? "Default UI" : "Dark UI"}
          </Button>
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
      <ToastContainer position="bottom-center"/>
    </Box>
  </ThemeProvider>
};

const CreateRoom = () => {
  const history = useHistory();

  const createRoom = () => {
    fetch(`${SERVER}/api/room/new`, {redirect: 'follow'})
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
    style={{minHeight: '50vh'}}
    className="container">
    <Box ml={1} display="inline">
      <Button color="primary" variant="contained" size="large" onClick={createRoom}>Create room</Button>
    </Box>
  </Grid>;
};

ReactDOM.render(<App/>, document.getElementById('root'));
