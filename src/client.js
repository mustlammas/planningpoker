'use strict';

import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {w3cwebsocket as W3CWebSocket} from 'websocket';
import { Box, Button, Chip, Divider, Grid, List, ListItem, TextField } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import CheckIcon from '@material-ui/icons/Check';

import * as Msg from './messages.js';
import './style.css';

import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';

const Root = () => {
  return (
    <RecoilRoot>
      <PokerPlanning />
    </RecoilRoot>
  );
};

const clientState = atom({
  key: 'client',
  default: null
});

const userState = atom({
  key: 'user',
  default: '',
});

const userSubmittedState = atom({
  key: 'user-submitted',
  default: false,
});

const clientsState = atom({
  key: 'clients',
  default: []
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

const PokerPlanning = () => {
  const [client, setClient] = useRecoilState(clientState);
  const [clients, setClients] = useRecoilState(clientsState);
  const [votes, setVotes] = useRecoilState(votesState);
  const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);
  const [errors, setErrors] = useRecoilState(errorsState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);

  useEffect(() => {
    setClient(new W3CWebSocket(WS_SERVER, 'echo-protocol'));
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

  return <Grid
    container
    spacing={0}
    direction="column"
    alignItems="center"
    justify="center"
    style={{ minHeight: '100vh' }}>
    <Title/>
    <WelcomeScreen/>
    <Poker/>
    <Result/>
    <Errors/>
  </Grid>
};

const Errors = () => {
  const [errors] = useRecoilState(errorsState);
  return <Box className="errors" color="secondary.main">
    {errors.map(e => <Box key={e}>{e}</Box>)}
  </Box>;
};

const points = ["1", "2", "3", "5", "8", "13", "21", "50", "?"];
const numericPoints = [1, 2, 3, 5, 8, 13, 21, 50];

const Poker = () => {
  const [client, setClient] = useRecoilState(clientState);
  const [user, setUser] = useRecoilState(userState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);
  const [votes, setVotes] = useRecoilState(votesState);

  const sendVote = (vote) => sendMessage(client, Msg.MSG_VOTE, vote);
  const resetVotes = () => sendMessage(client, Msg.MSG_RESET_VOTE);
  const becomeObserver = () => sendMessage(client, Msg.MSG_BECOME_OBSERVER);
  const becomeParticipant = () => sendMessage(client, Msg.MSG_BECOME_PARTICIPANT);

  const usersWithDiffingVotes = () => {
    if (everyoneHasVoted(votes)) {
      const numericVotes = votes
        .filter(v => !v.observer)
        .map(v => parseInt(v.vote))
        .filter(v => !isNaN(v))
        .sort();
      const minVote = Math.min(...numericVotes);
      const maxVote = Math.max(...numericVotes);
      const minVoteIndex = numericPoints.indexOf(minVote);
      const maxVoteIndex = numericPoints.indexOf(maxVote);
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

  return submitted ? <Box>
    <Box>
      {points.map(p => {
        let color = selectedPoints === p ? "secondary" : "primary";
        return <Box key={p} p={1} display="inline">
          <Button color={color} variant="contained" size="large" disabled={observer} onClick={() => {
            sendVote(p);
            setSelectedPoints(p);
          }}>{p}</Button>
        </Box>;
      })}
    </Box>
    <Box p={2} display="flex">
      <Box flexGrow={1}>
        <Button variant="contained" onClick={() => resetVotes()}>Reset</Button>
      </Box>
      {observer && <Button variant="contained" onClick={() => becomeParticipant()}>Participate</Button>}
      {!observer && <Button variant="contained" onClick={() => becomeObserver()}>Observe</Button>}
    </Box>
    <Box p={2} width={1/3} mx="auto">
      <TableContainer>
        <Table size="small" aria-label="a dense table">
          <TableBody>
            {votes.map(v => {
              let checkIcon = v.vote ? <CheckIcon/> : null;
              let style = diffingUsers.includes(v.username) ? {fontWeight: "bold", backgroundColor: "#ff7961"} : {fontWeight: "bold"};
              let nameStyle = user === v.username ? {fontWeight: "bold"} : {};
              let vote = v.observer ? <Chip label="observer"/> : everyoneHasVoted(votes) ? <Chip label={v.vote} style={style}/> : checkIcon;
              return <TableRow key={v.username}>
                <TableCell component="th" scope="row" style={nameStyle}>{v.username}</TableCell>
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
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [votes] = useRecoilState(votesState);

  if (!submitted) return null;

  if (everyoneHasVoted(votes)) {
    const numericVotes = votes
      .filter(v => !v.observer)
      .map(v => parseInt(v.vote))
      .filter(v => !isNaN(v))
      .sort();

    if (numericVotes.length === 0) {
      return <h1>?</h1>;
    }

    const minVote = Math.min(...numericVotes);
    const maxVote = Math.max(...numericVotes);
    const minVoteIndex = numericPoints.indexOf(minVote);
    const maxVoteIndex = numericPoints.indexOf(maxVote);
    const indexDiff = maxVoteIndex - minVoteIndex;

    if (indexDiff > 1) {
      return <h1>Conflicting votes!</h1>;
    } else {
      return <h1>{maxVote}</h1>;
    }
  } else {
    return <h1>Waiting for votes...</h1>;
  }
};

const Title = () => {
  return <h1>Planning Poker</h1>;
};

const WelcomeScreen = () => {
  const [client, setClient] = useRecoilState(clientState);
  const [user, setUser] = useRecoilState(userState);
  const sendJoinMessage = () => sendMessage(client, Msg.MSG_CLIENT_CONNECT, user);
  const [submitted] = useRecoilState(userSubmittedState);

  return submitted ? null :
    <div>
      <TextField label="Name" variant="standard" type="text" value={user} onChange={(e) => setUser(e.target.value)}/>
      <Box ml={1} display="inline">
        <Button color="primary" variant="contained" size="large" onClick={() => {
          sendJoinMessage();
        }}>Join</Button>
      </Box>
    </div>;
}

ReactDOM.render(<Root/>, document.getElementById('root'));
