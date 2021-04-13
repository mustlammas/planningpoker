'use strict';

import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import { io } from "socket.io-client";
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
import ViewColumnIcon from '@material-ui/icons/ViewColumn';

import * as Msg from '../shared/messages.js';
import './style.css';

import {
  atom,
  useRecoilState,
  useRecoilValue,
} from 'recoil';

import {useHistory} from "react-router-dom";

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
    <Result/>
    <Errors/>
  </Grid>
  </div>;
};

const ConfigModal = ({config, client}) => {
  const [configuring, setConfiguring] = useRecoilState(configuringState);
  const [options, setOptions] = useState([...config.options, {text: "", value: ""}]);

  const onSave = () => {
    const filtered = options.filter(o => o.text && o.value).map(o => {
      const value = isNaN(o.value) ? -1 : parseInt(o.value);
      return {
        text: o.text,
        value: value
      };
    });
    sendMessage(client, Msg.UPDATE_CONFIG, filtered);
    setConfiguring(false);
  };

  return <Modal
    style={{width: "400px"}}
    open={configuring}
    onClose={() => setConfiguring(false)}>
    <Box style={{backgroundColor: "#eee "}}>
      <TableContainer component={Paper}>
        <Table aria-label="Options table" size="small">
          <TableHead>
            <TableRow width="10rem">
              <TableCell>Label</TableCell>
              <TableCell align="right">Value (number)</TableCell>
              <TableCell/>
            </TableRow>
          </TableHead>
          <TableBody>
            {options.map((option, i) => {
              const onTextChange = (e) => {
                const newText = e.target.value;
                const newOptions = [...options];
                const oldOption = newOptions[i];
                const newOption = {
                  ...oldOption,
                  text: newText
                };

                newOptions.splice(i, 1, newOption);

                const lastOption = newOptions[newOptions.length - 1];
                if (lastOption.text && lastOption.value) {
                  newOptions.push({text: "", value: ""});
                }

                setOptions(newOptions);
              };

              const onValueChange = (e) => {
                const newValue = e.target.value;
                const newOptions = [...options];
                const oldOption = newOptions[i];
                const newOption = {
                  ...oldOption,
                  value: newValue
                };

                newOptions.splice(i, 1, newOption);

                const lastOption = newOptions[newOptions.length - 1];
                if (lastOption.text && lastOption.value) {
                  newOptions.push({text: "", value: ""});
                }

                setOptions(newOptions);
              };

              const onRemove = () => {
                const newOptions = [...options];
                newOptions.splice(i, 1);
                setOptions(newOptions);
              };

              return <TableRow key={i}>
                <TableCell>
                  <TextField variant="outlined" size="small" value={option.text} onChange={onTextChange}/>
                </TableCell>
                <TableCell align="left">
                  <TextField variant="outlined" size="small" value={option.value} onChange={onValueChange}/>
                </TableCell>
                <TableCell align="right">
                  {
                    option.text && option.value && <Button onClick={onRemove}>Remove</Button>
                  }
                </TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box style={{padding: "10px"}}>
        <i>Negative values are ignored when determining the result of a vote.</i>
      </Box>
      <Box display="flex" justifyContent="flex-end" style={{padding: "10px"}}>
        <Button color="primary" variant="contained" onClick={onSave}>Save</Button>
      </Box>
    </Box>
  </Modal>;
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
    {errors.map(e => <Box key={e}>{e}</Box>)}
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
      const numericVotes = votes
        .filter(v => !v.observer)
        .map(v => parseInt(v.vote))
        .filter(v => v >= 0)
        .sort();

      const minVote = Math.min(...numericVotes);
      const maxVote = Math.max(...numericVotes);
      const maxVoteObject = config.options.find(o => o.value === maxVote);
      const minVoteObject = config.options.find(o => o.value === minVote);
      const minVoteIndex = config.options.indexOf(minVoteObject);
      const maxVoteIndex = config.options.indexOf(maxVoteObject);
      const indexDiff = maxVoteIndex - minVoteIndex;

      if (indexDiff < 2) {
        return [];
      }

      return votes
        .filter(v => !v.observer)
        .filter(v => {
          if (!isNaN(v.vote)) {
            const nr = parseInt(v.vote);
            return nr === minVote || nr === maxVote
          } else {
            return false;
          }
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
      {config.options.map(option => {
        let color = selectedPoints === option.value ? "secondary" : "primary";
        return <Box key={option.value} p={1} display="inline">
          <Button color={color} variant="contained" size="large" disabled={observer} onClick={() => {
            sendVote(option.value);
            setSelectedPoints(option.value);
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
              let connProblem = v.connection_broken ? <WifiOffIcon color="#ccc"/> : null;
              let voteObject = config.options.find(o => o.value === v.vote) || {value: -1, text: "?"};
              let vote = v.observer ?
                <Chip label="observer"/> :
                everyoneHasVoted(votes) ?
                  <Chip label={voteObject.text} style={style}/> :
                  checkIcon;
              return <TableRow key={v.username} style={{height: "50px"}}>
                <TableCell align="left" style={nameStyle}>{v.username}</TableCell>
                <TableCell align="right">{connProblem} {vote}</TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  </Box> : null;
};

const Result = () => {
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [votes] = useRecoilState(votesState);
  const config = useRecoilValue(configState);

  if (!submitted) return null;

  if (everyoneHasVoted(votes)) {
    const numericVotes = votes
      .filter(v => !v.observer)
      .map(v => parseInt(v.vote))
      .filter(v => v >= 0)
      .sort();

    if (numericVotes.length === 0) {
      return <h1>?</h1>;
    }

    const minVote = Math.min(...numericVotes);
    const maxVote = Math.max(...numericVotes);
    const maxVoteObject = config.options.find(o => o.value === maxVote);
    const minVoteObject = config.options.find(o => o.value === minVote);
    const minVoteIndex = config.options.indexOf(minVoteObject);
    const maxVoteIndex = config.options.indexOf(maxVoteObject);
    const indexDiff = maxVoteIndex - minVoteIndex;

    if (indexDiff > 1) {
      return <h1>Conflicting votes!</h1>;
    } else {
      return <h1>{maxVoteObject && maxVoteObject.text}</h1>;
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
