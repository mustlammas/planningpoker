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

const chatState = atom({
  key: 'chat',
  default: ''
});

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

const PokerPlanning = () => {
  const [client, setClient] = useRecoilState(clientState);
  const [clients, setClients] = useRecoilState(clientsState);
  const [chat, setChat] = useRecoilState(chatState);
  const [votes, setVotes] = useRecoilState(votesState);
  const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);

  useEffect(() => {
    setClient(new W3CWebSocket(WS_SERVER, 'echo-protocol'));
  }, []);

  const processMsg = (msg) => {
    if (msg.type === Msg.MSG_CHAT) {
      setChat(`${chat}${msg.user}: ${msg.message}\n`);
    } else if (msg.type === Msg.MSG_UPDATE_USERS) {
      setVotes(msg.message);
    } else if (msg.type === Msg.MSG_RESET_VOTE) {
      setSelectedPoints(null);
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
    <Participants/>
    <Poker/>
    <Result/>
  </Grid>
};

const points = ["1", "2", "3", "5", "8", "13", "21", "50", "?"];
const numericPoints = [1, 2, 3, 5, 8, 13, 21, 50];

const Poker = () => {
  const [client, setClient] = useRecoilState(clientState);
  const [user, setUser] = useRecoilState(userState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);
  const [votes, setVotes] = useRecoilState(votesState);

  const sendVote = (vote) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: Msg.MSG_VOTE,
        message: vote
      }));
    }
  };

  const resetVotes = () => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: Msg.MSG_RESET_VOTE
      }));
    }
  };

  const reveal = votes.filter(v => !v.hasOwnProperty('vote')).length === 0;

  const everyoneHasVoted = votes.filter(v => !v.hasOwnProperty('vote')).length === 0;

  const usersWithDiffingVotes = () => {
    if (everyoneHasVoted) {
      const numericVotes = votes.map(v => parseInt(v.vote)).filter(v => !isNaN(v)).sort();
      const minVote = Math.min(...numericVotes);
      const maxVote = Math.max(...numericVotes);
      const minVoteIndex = numericPoints.indexOf(minVote);
      const maxVoteIndex = numericPoints.indexOf(maxVote);
      const indexDiff = maxVoteIndex - minVoteIndex;

      if (indexDiff < 2) {
        return [];
      }

      return votes.filter(v => {
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

  return submitted ? <Box>
    <Box>
      {points.map(p => {
        let color = selectedPoints === p ? "secondary" : "primary";
        return <Box key={p} p={1} display="inline">
          <Button color={color} variant="contained" size="large" onClick={() => {
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
    </Box>
    <Box p={2} width={1/3} mx="auto">
      <TableContainer>
        <Table size="small" aria-label="a dense table">
          <TableBody>
            {votes.map(v => {
              let checkIcon = v.vote ? <CheckIcon/> : null;
              let style = diffingUsers.includes(v.username) ? {fontWeight: "bold", backgroundColor: "#ff7961"} : {fontWeight: "bold"};
              let nameStyle = user === v.username ? {fontWeight: "bold"} : {};
              return <TableRow key={v.username}>
                <TableCell component="th" scope="row" style={nameStyle}>{v.username}</TableCell>
                <TableCell align="right">{reveal ? <Chip label={v.vote} style={style}/> : checkIcon}</TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  </Box> : null;
};

const Chat = () => {
  const [client, setClient] = useRecoilState(clientState);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useRecoilState(chatState);
  const [user, setUser] = useRecoilState(userState);
  const [clients, setClients] = useRecoilState(clientsState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);

  const sendMessage = (message) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: Msg.MSG_CHAT,
        user: user,
        message: message
      }));
      setMessage("");
    }
  };

  return submitted ?
  <div>
    <div>
      <input id="message" name="message" type="text" value={message} onChange={(e) => setMessage(e.target.value)}/>
      <input id="send" type="button" onClick={(e) => sendMessage(message)} value="Send"/>
    </div>
    <div>
      <textarea id="chat" className="chat" value={chat} readOnly={true} style={{height: "200px", width: "300px"}}/>
    </div>
  </div> : null;
};

const Result = () => {
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [votes] = useRecoilState(votesState);
  const everyoneHasVoted = votes.filter(v => !v.hasOwnProperty('vote')).length === 0;

  if (!submitted) return null;

  if (everyoneHasVoted) {
    const numericVotes = votes.map(v => parseInt(v.vote)).filter(v => !isNaN(v)).sort();

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

const Participants = () => {
  const [client, setClient] = useRecoilState(clientState);
  const [user, setUser] = useRecoilState(userState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  const [clients, setClients] = useRecoilState(clientsState);

  const sendJoinMessage = () => {
    if (client && client.readyState === client.OPEN) {
      console.log(`Sending message: ${Msg.MSG_CLIENT_CONNECT}`);
      client.send(JSON.stringify({
        type: Msg.MSG_CLIENT_CONNECT,
        message: user
      }));
    }
  };

  if (submitted) {
    return <div className="users">
      {clients.map(c => {
        return <Box key={c}>{c}</Box>;
      })}
    </div>;
  } else {
    return <div>
      <TextField label="Name" variant="standard" type="text" value={user} onChange={(e) => setUser(e.target.value)}/>
      <Box ml={1} display="inline">
        <Button color="primary" variant="contained" size="large" onClick={() => {
          sendJoinMessage();
          setSubmitted(true);
        }}>Join</Button>
      </Box>
    </div>;
  }
}

ReactDOM.render(<Root/>, document.getElementById('root'));
