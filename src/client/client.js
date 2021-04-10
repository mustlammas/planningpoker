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
import ViewColumnIcon from '@material-ui/icons/ViewColumn';

import {clientState} from './state.js';

import * as Msg from '../shared/messages.js';
import './style.css';

import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';

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

const roomState = atom({
  key: 'room',
  default: 'default'
});

const everyoneHasVoted = (votes) => {
  return votes
    .filter(v => !v.observer)
    .filter(v => !v.hasOwnProperty('vote'))
    .length === 0;
};

const sendMessage = (client, type, message) => {
  if (client && client.readyState === client.OPEN) {
    client.send(JSON.stringify({
      type: type,
      message: message
    }));
  }
};

export const PokerPlanning = ({roomId}) => {
  const [client, setClient] = useRecoilState(clientState);
  const [clients, setClients] = useRecoilState(clientsState);
  const [votes, setVotes] = useRecoilState(votesState);
  const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);
  const [errors, setErrors] = useRecoilState(errorsState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [config, setConfig] = useRecoilState(configState);
  const [room, setRoom] = useRecoilState(roomState);

  useEffect(() => {
    setClient(new W3CWebSocket(WS_SERVER, 'echo-protocol'));
    setRoom(roomId);
  }, []);

  const processMsg = (msg) => {
    if (msg.type === Msg.MSG_UPDATE_USERS) {
      setVotes(msg.message);
    } else if (msg.type === Msg.MSG_RESET_VOTE) {
      setSelectedPoints(null);
    } else if (msg.type === Msg.MSG_USER_EXISTS) {
      const e = [...errors];
      e.push("Name is in use. Pick another.");
      setErrors(e);
    } else if (msg.type === Msg.MSG_USERNAME_OK) {
      setErrors([]);
      setSubmitted(true);
    } else if (msg.type === Msg.MSG_HEARTBEAT) {
      sendMessage(client, Msg.MSG_HEARTBEAT, msg.message);
    } else if (msg.type === Msg.MSG_CONFIG) {
      console.log("Received config: ", msg.message);
      setConfig(msg.message);
    }
  };

  if (client) {
    client.onmessage = (msg) => {
      try {
        processMsg(JSON.parse(msg.data));
      } catch(e) {
        console.warn(e);
      }
    };
  }

  return <div>
  <Grid
    container
    spacing={0}
    direction="column"
    alignItems="center"
    justify="center"
    style={{ minHeight: '50vh'}}
    className="container">
    <WelcomeScreen roomId={roomId}/>
    <Poker/>
    <Result/>
    <Errors/>
  </Grid>
  </div>;
};

const ConfigModal = ({config}) => {
  const [configuring, setConfiguring] = useRecoilState(configuringState);
  const [client, setClient] = useRecoilState(clientState);
  const [room, setRoom] = useRecoilState(roomState);

  const [options, setOptions] = useState([...config.options, {text: "", value: ""}]);

  const onSave = () => {
    const filtered = options.filter(o => o.text && o.value).map(o => {
      const value = isNaN(o.value) ? -1 : parseInt(o.value);
      return {
        text: o.text,
        value: value
      };
    });
    sendMessage(client, Msg.MSG_UPDATE_CONFIG, filtered);
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

const Config = () => {
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [configuring, setConfiguring] = useRecoilState(configuringState);
  const [config, setConfig] = useRecoilState(configState);

  return submitted && <>
    <Button onClick={() => setConfiguring(true)} size="large">
      <SettingsIcon color="disabled"/>
    </Button>
    {
      configuring && <ConfigModal config={config}/>
    }
  </>;
};

const Errors = () => {
  const [errors] = useRecoilState(errorsState);
  return <Box className="errors" color="secondary.main">
    {errors.map(e => <Box key={e}>{e}</Box>)}
  </Box>;
};

const Poker = () => {
  const [client, setClient] = useRecoilState(clientState);
  const [user, setUser] = useRecoilState(userState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);
  const [votes, setVotes] = useRecoilState(votesState);
  const config = useRecoilValue(configState);
  const [configuring, setConfiguring] = useRecoilState(configuringState);
  const [room, setRoom] = useRecoilState(roomState);

  const sendVote = (vote) => sendMessage(client, Msg.MSG_VOTE, vote);
  const resetVotes = () => sendMessage(client, Msg.MSG_RESET_VOTE);
  const becomeObserver = () => sendMessage(client, Msg.MSG_BECOME_OBSERVER);
  const becomeParticipant = () => sendMessage(client, Msg.MSG_BECOME_PARTICIPANT);
  const revealVotes = () => sendMessage(client, Msg.MSG_REVEAL_VOTES);

  const usersWithDiffingVotes = () => {
    if (everyoneHasVoted(votes) && config.options) {
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

  return submitted && config.options ? <Box>
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
        <Config/>
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

export const WelcomeScreen = ({roomId}) => {
  const [client, setClient] = useRecoilState(clientState);
  const [user, setUser] = useRecoilState(userState);
  const sendJoinMessage = () => sendMessage(client, Msg.MSG_CLIENT_CONNECT, {
    username: user,
    room: roomId
  });
  const [submitted] = useRecoilState(userSubmittedState);
  const onEnter = (e) => {
    if(e.keyCode == 13) sendJoinMessage();
  };

  return submitted ? null :
    <div>
      <TextField onKeyDown={onEnter} autoFocus label="Name" variant="standard" type="text" value={user} onChange={(e) => setUser(e.target.value)}/>
      <Box ml={1} display="inline">
        <Button color="primary" variant="contained" size="large" onClick={() => {
          sendJoinMessage();
        }}>Join</Button>
      </Box>
    </div>;
}
