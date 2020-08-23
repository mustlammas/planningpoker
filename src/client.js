'use strict';

import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {w3cwebsocket as W3CWebSocket} from 'websocket';

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

const userState = atom({
  key: 'user',
  default: '',
});

const userSubmittedState = atom({
  key: 'user-submitted',
  default: false,
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
  const [client, setClient] = useState(null);
  const [text, setText] = useState('');
  const [user, setUser] = useRecoilState(userState);


  useEffect(() => {
    setClient(new W3CWebSocket('ws://localhost:3000/chat', 'echo-protocol'));
  }, []);

  if (client) {
    client.onmessage = (msg) => {
      setText(`${text}${msg.data}\n`);
    };
  }

  const sendMessage = (message) => {
    if (client.readyState === client.OPEN) {
      client.send(user + ": " + message);
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
      <textarea id="chat" class="chat" value={text} readOnly={true} style={{height: "200px", width: "300px"}}/>
    </div>
  </div> : null;
};

const User = () => {
  const [user, setUser] = useRecoilState(userState);
  const [submitted, setSubmitted] = useRecoilState(userSubmittedState);
  if (submitted) {
    return <div>{user}</div>;
  } else {
    return <div>
      <input type="text" value={user} onChange={(e) => setUser(e.target.value)}/>
      <input type="button" value="Join" onClick={() => setSubmitted(true)}/>
    </div>;
  }
}

ReactDOM.render(<Root/>, document.getElementById('root'));
