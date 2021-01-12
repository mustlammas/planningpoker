import React, {useEffect, useRef, useState} from 'react';
import {Box, Link} from '@material-ui/core';
import {WelcomeScreen, PokerPlanning} from './client.js';
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import {
  useParams
} from "react-router-dom";

export const Room = () => {
  let { id } = useParams();
  return <RecoilRoot>
    <PokerPlanning roomId={id}/>
  </RecoilRoot>;
}
