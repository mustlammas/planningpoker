'use strict';

import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {w3cwebsocket as W3CWebSocket} from 'websocket';
import * as Msg from './messages.js' ;

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
  key: 'client'
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

const PokerPlanning = () => {
  return <div>
    <div>Planning poker</div>
    <User/>
    <Chat/>
  </div>;
};

const Chat = () => {
  const [message, setMessage] = useState('');
  const [client, setClient] = useRecoilState(clientState);
  const [text, setText] = useState('');
  const [user, setUser] = useRecoilState(userState);
  const [clients, setClients] = useRecoilState(clientsState);

  useEffect(() => {
    setClient(new W3CWebSocket('ws://localhost:3000/chat', 'echo-protocol'));
  }, []);

  const processMsg = (msg) => {
    if (msg.type === Msg.MSG_CHAT) {
      setText(`${text}${msg.user}: ${msg.message}\n`);
    } else if (msg.type === Msg.MSG_CLIENT_LIST) {
      console.log("Received client list: ", msg);
      setClients(msg.message);
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
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);

  return submitted ?
  <div>
    <div>
      <input id="message" name="message" type="text" value={message} onChange={(e) => setMessage(e.target.value)}/>
      <input id="send" type="button" onClick={(e) => sendMessage(message)} value="Send"/>
    </div>
    <div>
      <textarea id="chat" className="chat" value={text} readOnly={true} style={{height: "200px", width: "300px"}}/>
    </div>
  </div> : null;
};

const User = () => {
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
        let isMe = c === user;
        return <div key={c} className={isMe ? "user-me" : "user"}>{c}</div>;
      })}
    </div>;
  } else {
    return <div>
      <input type="text" value={user} onChange={(e) => setUser(e.target.value)}/>
      <input type="button" value="Join" onClick={() => {
        sendJoinMessage();
        setSubmitted(true);
      }}/>
    </div>;
  }
}

ReactDOM.render(<Root/>, document.getElementById('root'));
