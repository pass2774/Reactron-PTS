import React, { useEffect, useState, useRef} from "react";
import logo from './logo.svg';
import './App.css';
import {SEND_MAIN_PING} from './constants'

import io from 'socket.io-client';

const {ipcRenderer} = window;

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
});
console.log("socket created");
function App() {
  const inputRef = useRef(null);
  console.log("app created");
  const [messages, setMessages] = useState([]);
  // let messages = [];

  useEffect(() => {

    console.log("useEffect called");

    // Attach the event listener
    socket.on('chat message', handleChatMessage);

    return () => {
      console.log("useEffect cleanup called");
      // Detach the event listener
      socket.off('chat message', handleChatMessage);
    };
  }, [socket]);

  const handleChatMessage = (msg) => {
    console.log("handleChatMessage called");
    console.log(msg);
    // messages.push(msg);
    
    // setMessages([msg]);
    setMessages((prevMessages) => [...prevMessages, msg]);
  };


  const sendMessage = (e) => {
    e.preventDefault();

    // Access the value of the input directly using the ref
    const messageInputValue = inputRef.current.value;

    // Emit a 'chat message' event to the Socket.IO server
    socket.emit('chat message', messageInputValue);

    // Optionally, you can clear the input field
    inputRef.current.value = '';
  };


  //get text from input and send it to main.js


  return (
    <div className="App">
      <div className="bg-white w-full h-full flex flex-col items-center py-[1rem] px-[8rem]">
        <div className="flex">
            <div className = "flex flex-col items-center w-[28rem]">
            <div>
              <form onSubmit={sendMessage}>
                <ul>
                  {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                  ))}
                </ul>
                <input
                  type="text"
                  className="bg-[green]"
                  ref={inputRef}
                  // No onChange event, so it won't trigger state updates on each keystroke
                />
                <button type="submit" className="bg-[yellow]">
                  Send
                </button>
              </form>
            </div>
            </div>
          </div>
      </div>
    </div>
  );
}

export default App;
