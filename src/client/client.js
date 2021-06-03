'use strict';

import React, {useEffect, useState} from 'react';
import { io } from "socket.io-client";
import {
  Box,
  Button,
  Chip,
  Grid,
  TextField
} from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import CheckIcon from '@material-ui/icons/Check';

import * as Msg from '../shared/messages.js';
import './style.css';

import {
  atom,
  useRecoilState,
  useRecoilValue, useSetRecoilState,
} from 'recoil';

import {useHistory} from "react-router-dom";
import {everyoneHasVoted, sendMessage} from "./common";
import {configState, votesState} from "./state";
import {Result} from "./result";
import {Config} from "./config";

const userState = atom({
  key: 'user',
  default: '',
});

const userSubmittedState = atom({
  key: 'user-submitted',
  default: false,
});

const selectedPointsState = atom({
  key: 'selectedPoints'
});

const errorsState = atom({
  key: 'errors',
  default: []
});

export const PokerPlanning = ({roomId}) => {
  const setVotes = useSetRecoilState(votesState);
  const setSelectedPoints = useSetRecoilState(selectedPointsState);
  const [errors, setErrors] = useRecoilState(errorsState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const setConfig = useSetRecoilState(configState);
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
      {submitted && <Poker client={client}/>}
      {submitted && <Result/>}
      <Errors/>
    </Grid>
  </div>;
};

const Errors = () => {
  const [errors] = useRecoilState(errorsState);
  return <Box className="errors" color="secondary.main">
    {errors.map((e, i) => <Box key={i}>{e}</Box>)}
  </Box>;
};

const Poker = ({client}) => {
  const user = useRecoilValue(userState);
  const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);
  const votes = useRecoilValue(votesState);
  const config = useRecoilValue(configState);

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

  return config && config.options ? <Box>
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
