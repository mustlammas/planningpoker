'use strict';

import React, {useEffect, useState} from 'react';
import {useHistory} from "react-router-dom";
import { io } from "socket.io-client";
import {
  Grid
} from '@material-ui/core';
import {
  useRecoilState,
  useSetRecoilState,
} from 'recoil';

import * as Msg from '../shared/messages.js';
import './style.css';
import {configState, errorsState, selectedPointsState, userSubmittedState, votesState} from "./state";
import {Result} from "./result";
import {WelcomeScreen} from "./welcome";
import {Errors} from "./errors";
import {Poker} from "./poker";

export const PokerClient = ({roomId}) => {
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

  return <Grid
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
  </Grid>;
};
