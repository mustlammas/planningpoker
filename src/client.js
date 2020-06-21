'use strict';

import React, {useState} from 'react';
import ReactDOM from 'react-dom';

const PokerPlanning = () => {
  const [chat, setChat] = useState("");

  return <div>
    <div>React component</div>
    <div>
      <input id="chat" name="chat" type="text" value={chat} onChange={(e) => setChat(e.target.value)}/>
    </div>
  </div>;
};

ReactDOM.render(<PokerPlanning/>, document.getElementById('root'));
