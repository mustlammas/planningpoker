'use strict';

import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import { io } from "socket.io-client";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  TextField,
  Modal,
  ListItemText,
  Dialog, AppBar, makeStyles, Slide
} from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import WifiOffIcon from '@material-ui/icons/WifiOff';
import SettingsIcon from '@material-ui/icons/Settings';
import ViewColumnIcon from '@material-ui/icons/ViewColumn';

import * as Msg from '../shared/messages.js';
import './style.css';

import {
  atom,
  useRecoilState,
  useRecoilValue,
} from 'recoil';

import {useHistory} from "react-router-dom";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";

const clientsState = atom({
  key: 'clients',
  default: []
});

const userState = atom({
  key: 'user',
  default: '',
});

const userSubmittedState = atom({
  key: 'user-submitted',
  default: false,
});

const votesState = atom({
  key: 'votesState',
  default: []
});

const selectedPointsState = atom({
  key: 'selectedPoints'
});

const errorsState = atom({
  key: 'errors',
  default: []
});

const configState = atom({
  key: 'config',
  default: {}
});

const configuringState = atom({
  key: 'configuring',
  default: false
});

const everyoneHasVoted = (votes) => {
  return votes
    .filter(v => !v.observer)
    .filter(v => !v.hasOwnProperty('vote'))
    .length === 0;
};

const sendMessage = (client, type, message) => {
  if (client) {
    client.emit(type, JSON.stringify(message));
  }
};

export const PokerPlanning = ({roomId}) => {
  const [clients, setClients] = useRecoilState(clientsState);
  const [votes, setVotes] = useRecoilState(votesState);
  const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);
  const [errors, setErrors] = useRecoilState(errorsState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [config, setConfig] = useRecoilState(configState);
  const [client, setClient] = useState();
  const history = useHistory();

  useEffect(() => {
    const socket = io(WS_SERVER);

    socket.on(Msg.ERROR, (msg) => {
      const e = JSON.parse(msg);
      console.log("Error: ", e);
      setErrors([e.error]);
    });
    socket.on(Msg.UPDATE_USERS, (msg) => {
      console.log(Msg.UPDATE_USERS);
      const votes = JSON.parse(msg);
      setVotes(votes);
    });
    socket.on(Msg.RESET_VOTE, (msg) => {
      console.log(Msg.RESET_VOTE);
      setSelectedPoints(undefined);
    });
    socket.on(Msg.USER_EXISTS, (msg) => {
      console.log(Msg.USER_EXISTS);
      const e = [...errors];
      e.push("Name is in use. Pick another.");
      setErrors(e);
    });
    socket.on(Msg.USERNAME_OK, (msg) => {
      console.log(Msg.USERNAME_OK);
      setErrors([]);
      setSubmitted(true);
    });
    socket.on(Msg.CONFIG, (msg) => {
      console.log(Msg.CONFIG);
      setConfig(JSON.parse(msg));
    });
    socket.on(Msg.ROOM_REMOVED, (msg) => {
      console.log(Msg.ROOM_REMOVED);
      socket.disconnect();
      history.push('/');
    });

    setClient(socket);
    return () => socket.disconnect();
  }, [WS_SERVER]);

  return <div>
  <Grid
    container
    spacing={0}
    direction="column"
    alignItems="center"
    justify="center"
    style={{ minHeight: '50vh'}}
    className="container">
    <WelcomeScreen roomId={roomId} client={client}/>
    <Poker client={client}/>
    {submitted && <Result/>}
    <Errors/>
  </Grid>
  </div>;
};

const ConfigModal = ({config, client}) => {
  const [configuring, setConfiguring] = useRecoilState(configuringState);
  const [options, setOptions] = useState([...config.options, {text: "", conflicting: []}]);

  const onSave = () => {
    const filtered = options.filter(o => o.text).map(o => {
      return {
        text: o.text,
        conflicting: o.conflicting
      };
    });
    sendMessage(client, Msg.UPDATE_CONFIG, filtered);
    setConfiguring(false);
  };

  const useStyles = makeStyles((theme) => ({
    appBar: {
      position: 'relative',
    },
    title: {
      marginLeft: theme.spacing(2),
      flex: 1,
    }
  }));

  const classes = useStyles();

  const handleClose = () => {
    setConfiguring(false);
  };

  return <Dialog fullScreen open={configuring} onClose={handleClose}>
    <AppBar className={classes.appBar}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          Options
        </Typography>
        <Button autoFocus color="inherit" onClick={onSave}>
          Save
        </Button>
      </Toolbar>
    </AppBar>
    <TableContainer component={Paper}>
      <Table aria-label="Options table" size="small">
        <TableHead>
          <TableRow width="10rem">
            <TableCell>Label</TableCell>
            <TableCell>Conflicting options</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {options.map((option, optIndex) => {
            const onTextChange = (e) => {
              const newText = e.target.value;
              const newOptions = [...options];
              const oldOption = newOptions[optIndex];
              const newOption = {
                ...oldOption,
                text: newText
              };

              newOptions.splice(optIndex, 1, newOption);

              const lastOption = newOptions[newOptions.length - 1];
              if (lastOption.text) {
                newOptions.push({text: "", value: "", conflicting: []});
              }

              setOptions(newOptions);
            };

            const onRemove = () => {
              const newOptions = [...options];
              newOptions.splice(optIndex, 1);
              setOptions(newOptions);
            };

            const toggleConflicting = (text, i, oIndex) => {
              const isConflicting = option.conflicting.includes(text);
              if (isConflicting) {
                const copy = option.conflicting.filter(c => c !== text);
                const optionCopy = {...option};
                optionCopy.conflicting = copy;
                const newOptions = [...options];
                newOptions.splice(oIndex, 1, optionCopy);

                const otherOption = options.find(o => o.text === text);
                const otherOptionIndex = options.indexOf(otherOption);
                const otherCopy = otherOption.conflicting.filter(c => c !== option.text);
                const otherOptionCopy = {...otherOption};
                otherOptionCopy.conflicting = otherCopy;
                newOptions.splice(otherOptionIndex, 1, otherOptionCopy);

                setOptions(newOptions);
              } else {
                const copy = [...option.conflicting];
                copy.splice(i, 0, text);
                const optionCopy = {...option};
                optionCopy.conflicting = copy;
                const newOptions = [...options];
                newOptions.splice(oIndex, 1, optionCopy);

                const otherOption = options.find(o => o.text === text);
                const otherOptionIndex = options.indexOf(otherOption);
                const otherCopy = [...otherOption.conflicting];
                otherCopy.splice(i, 0, option.text);
                const otherOptionCopy = {...otherOption};
                otherOptionCopy.conflicting = otherCopy;
                newOptions.splice(otherOptionIndex, 1, otherOptionCopy);

                setOptions(newOptions);
              }
            };

            const hasLabel = option.text.trim() !== "";

            return <TableRow key={optIndex}>
              <TableCell>
                <TextField variant="outlined" size="small" value={option.text} onChange={onTextChange}/>
              </TableCell>
              <TableCell>
                {
                  hasLabel && options.filter(o => o.text.trim() !== "").map((o, i) => {
                    const isThisOption = o.text === option.text;
                    const style = isThisOption ?
                        {} :
                        option.conflicting.includes(o.text) ?
                            {backgroundColor: "#ff7961"} :
                            {}
                    const variant = isThisOption ? "default" : "outlined";
                    return <Chip
                        key={i}
                        label={o.text}
                        disabled={isThisOption}
                        onClick={() => toggleConflicting(o.text, i, optIndex)}
                        variant={variant}
                        style={style}
                    />;
                  })
                }
              </TableCell>
              <TableCell align="right">
                {
                  option.text && <Button onClick={onRemove}>Remove</Button>
                }
              </TableCell>
            </TableRow>;
          })}
        </TableBody>
      </Table>
    </TableContainer>
  </Dialog>;
};

const Config = ({client}) => {
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [configuring, setConfiguring] = useRecoilState(configuringState);
  const [config, setConfig] = useRecoilState(configState);

  return submitted && <>
    <Button onClick={() => setConfiguring(true)} size="large">
      <SettingsIcon color="disabled"/>
    </Button>
    {
      configuring && <ConfigModal config={config} client={client}/>
    }
  </>;
};

const Errors = () => {
  const [errors] = useRecoilState(errorsState);
  return <Box className="errors" color="secondary.main">
    {errors.map((e, i) => <Box key={i}>{e}</Box>)}
  </Box>;
};

const Poker = ({client}) => {
  const [user, setUser] = useRecoilState(userState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);
  const [votes, setVotes] = useRecoilState(votesState);
  const config = useRecoilValue(configState);
  const [configuring, setConfiguring] = useRecoilState(configuringState);

  const sendVote = (vote) => sendMessage(client, Msg.VOTE, {vote: vote});
  const resetVotes = () => {
    setSelectedPoints(undefined);
    sendMessage(client, Msg.RESET_VOTE);
  };
  const becomeObserver = () => {
    setSelectedPoints(undefined);
    sendMessage(client, Msg.BECOME_OBSERVER);
  };
  const becomeParticipant = () => sendMessage(client, Msg.BECOME_PARTICIPANT);
  const revealVotes = () => sendMessage(client, Msg.REVEAL_VOTES);

  const usersWithDiffingVotes = () => {
    if (everyoneHasVoted(votes) && config && config.options) {
      return votes
          .filter(v => !v.observer)
          .filter(v => {
        let option = config.options.find(o => o.text === v.vote) || {text: "?", conflicting: []};
        let conflictingVote = votes.find(v => {
          return option.conflicting.includes(v.vote);
        });

        return conflictingVote ? true : false;
      }).map(v => v.username);
    } else {
      return [];
    }
  };

  const diffingUsers = usersWithDiffingVotes();
  const myVote = votes.find(v => v.username === user);
  const observer = myVote && myVote.observer;

  return submitted && config && config.options ? <Box>
    <Grid container justify="center">
      {config.options.map((option, i) => {
        let color = selectedPoints === option.text ? "secondary" : "primary";
        return <Box key={i} p={1} display="inline">
          <Button color={color} variant="contained" size="large" disabled={observer} onClick={() => {
            sendVote(option.text);
            setSelectedPoints(option.text);
          }}>{option.text}</Button>
        </Box>;
      })}
      <Box p={1} display="inline">
        <Config client={client}/>
      </Box>
    </Grid>
    <Box p={2} display="flex">
      <Box flexGrow={1}>
        <Box display="inline" ml={2}><Button variant="contained" onClick={() => resetVotes()}>Reset</Button></Box>
        <Box display="inline" ml={2}><Button variant="contained" onClick={() => revealVotes()}>Reveal</Button></Box>
      </Box>
      {observer && <Button variant="contained" onClick={() => becomeParticipant()}>Participate</Button>}
      {!observer && <Button variant="contained" onClick={() => becomeObserver()}>Observe</Button>}
    </Box>
    <Box p={2} width="300px" mx="auto">
      <TableContainer>
        <Table size="small" aria-label="a table">
          <TableBody>
            {votes.map(v => {
              let checkIcon = v.vote ? <CheckIcon/> : null
              let style = diffingUsers.includes(v.username) ? {fontWeight: "bold", backgroundColor: "#ff7961"} : {fontWeight: "bold"};
              let nameStyle = user === v.username ? {fontWeight: "bold"} : {};
              let voteObject = config.options.find(o => o.text === v.vote) || {text: "?"};
              let vote = v.observer ?
                <Chip label="observer"/> :
                everyoneHasVoted(votes) ?
                  <Chip label={voteObject.text} style={style}/> :
                  checkIcon;
              return <TableRow key={v.username} style={{height: "50px"}}>
                <TableCell align="left" style={nameStyle}>{v.username}</TableCell>
                <TableCell align="right">{vote}</TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  </Box> : null;
};

const Result = () => {
  const [votes] = useRecoilState(votesState);
  const config = useRecoilValue(configState);
  const options = config.options;

  if (everyoneHasVoted(votes)) {
    const participantVotes = votes.filter(v => !v.observer);

    if (participantVotes.length === 0) {
      return <h1>?</h1>;
    }

    const conflictingVotes = participantVotes.filter(v => {
      const conflicting = options.find(o => o.text === v.vote).conflicting;
      return conflicting.find(c => {
        return participantVotes.map(pv => pv.vote).find(pv => pv === c);
      });
    });

    const votesWithIndexes = votes.map(v => {
      const option = options.find(o => o.text === v.vote);
      return {
        ...v,
        index: options.lastIndexOf(option)
      };
    });
    votesWithIndexes.sort((a,b) => (a.index > b.index) ? 1 : ((b.index > a.index) ? -1 : 0));

    const largestVote = votesWithIndexes.pop();

    if (conflictingVotes.length > 0) {
      return <h1>Conflicting votes!</h1>;
    } else {
      return <h1>{largestVote.vote}</h1>;
    }
  } else {
    return <h1>Waiting for votes...</h1>;
  }
};

export const WelcomeScreen = ({roomId, client}) => {
  const [user, setUser] = useRecoilState(userState);
  const sendJoinMessage = () => sendMessage(client, Msg.JOIN, {
    username: user,
    room: roomId
  });
  const [submitted] = useRecoilState(userSubmittedState);
  const onEnter = (e) => {
    if(e.keyCode == 13) sendJoinMessage();
  };
  const isValidName = () => user && user.trim().length > 0;

  return submitted ? null :
    <div>
      <TextField onKeyDown={onEnter} autoFocus label="Name" variant="standard" type="text" value={user} onChange={(e) => setUser(e.target.value)}/>
      <Box ml={1} display="inline">
        <Button color="primary" variant="contained" size="large" onClick={() => {
          sendJoinMessage();
        }} disabled={!isValidName()}>Join</Button>
      </Box>
    </div>;
}
