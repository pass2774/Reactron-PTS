import { useEffect, useState, useRef } from "react";
import logo from './logo.svg';
import './App.css';
import {SEND_MAIN_PING} from './constants'

import { CustomButton, SectionLevel1, SectionLevel2, FieldSelector, FieldInput, FieldText, RobotModeIndicatorSection, LedIndicator} from './component/elements'
import { RobotSection, ConfigSection } from './component/sections';

import io from 'socket.io-client';


const {ipcRenderer} = window;

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
});

function App() {
  const [moduleProfile, setModuleProfile] = useState({});
  const [serverEndpoint, setServerEndpoint] = useState("https://api.portal301.com");
  // const [robotEndPoint, setRobotEndPoint] = useState("192.167.0.3");
  const [robotEndPoint, setRobotEndPoint] = useState("192.168.0.68");


  console.log("app created");


  useEffect(() => {
    // ipcRenderer.send("app_version");
    // ipcRenderer.on("files", (event, args) => {
    //   setFiles(args.files);
    // });

    const requestForm = {
      moduleProfile: "dummy",
    };
    console.log("connectionRequestForm: ", requestForm);
    ipcRenderer.send("robot-dashboard-request", requestForm);


    ipcRenderer.on("robot-dashboard", (event, args) => {
      console.log("robot-dashboard: ", args);
      if (args.hasOwnProperty("moduleProfile")) {
        setModuleProfile(args.moduleProfile);
      }
    })
  }, []);

  
  const onEndpointUpdate = (endpoint) => {
    setServerEndpoint(endpoint.server);
    setRobotEndPoint(endpoint.robot);
  }

  return (
    <div className="App">
      <div className="bg-white w-full h-full flex flex-col items-center py-[1rem] px-[8rem]">
        <div className="flex">
          <ConfigSection onEndpointUpdate={onEndpointUpdate} moduleProfile={moduleProfile}/>
          <div className="flex flex-col gap-[1rem]">
            <CameraSection />
            <RobotSection socket={socket} endpoint={{server:serverEndpoint, robot:robotEndPoint}}/>
          </div>
        </div>
      </div>
    </div>
  );
}



const CameraSection = () => {
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);

  const onStartStreammingBtnClick = () => {
    ipcRenderer.send("runExternalProcess");
  }
  const sendMessage = (e) => {
    e.preventDefault();
    // Access the value of the input directly using the ref
    const messageInputValue = inputRef.current.value;
    socket.emit('chat message', messageInputValue);
    inputRef.current.value = '';
  };

  useEffect(() => {
    // Use useEffect to run the setup only once when the component mounts
    const handleChatMessage = (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    };
    console.log("useEffect")

    socket.emit('settings', {robotProfile: null});

    // Attach the event listener
    socket.on('chat message', handleChatMessage);

    // Cleanup: Remove the event listener when the component unmounts
    return () => {
      socket.off('chat message', handleChatMessage);
    };
  }, [socket]); // Run the effect when the socket instance changes (component mounts or unmounts)

  return(
    <SectionLevel1>
    <div className="bg-[white] w-full h-[28rem] flex flex-col p-[1rem] rounded-xl border border-2 border-gray">
      <div className="text-3xl">Camera Section</div>
      <button className="bg-[#ACF] w-[12rem] h-[5rem] rounded-xl shadow-md text-2xl text-[white] m-[0.2rem]" onClick={onStartStreammingBtnClick}>Start Streaming</button>
      <button className="bg-[#ACF] w-[12rem] h-[5rem] rounded-xl shadow-md text-2xl text-[white] m-[0.2rem]" onClick={onStartStreammingBtnClick}>Disconnect</button>
    </div>

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
  </SectionLevel1>

  )
}


export default App;

