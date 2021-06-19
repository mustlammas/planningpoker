import React from 'react';
import {PokerClient} from './poker-client.js';
import {
  useParams
} from "react-router-dom";

export const Room = () => {
  let { id } = useParams();
  return <PokerClient roomId={id}/>;
}
