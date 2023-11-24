import { useEffect, useState, useRef } from "react";
import logo from './logo.svg';
import './App.css';
import {SEND_MAIN_PING} from './constants'

import { CustomButton, SectionLevel1, SectionLevel2, FieldSelector, FieldInput, FieldText, RobotModeIndicatorSection, LedIndicator} from './component/elements'

import io from 'socket.io-client';

const ROBOT_OPERATION_STATUS_UNKNOWN = 0;
const ROBOT_OPERATION_STATUS_POWER_OFF = 1;
const ROBOT_OPERATION_STATUS_POWER_ON = 2;
const ROBOT_OPERATION_STATUS_BOOTING = 3;
const ROBOT_OPERATION_STATUS_ROBOT_IDLING = 4;
const ROBOT_OPERATION_STATUS_RELEASING_BRAKE = 5;
const ROBOT_OPERATION_STATUS_ROBOT_OPERATIONAL = 6;




const {ipcRenderer} = window;

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
});

function App() {
  const [robotOperationStatus, setRobotOperationStatus] = useState(0); //  Power Off,  Booting, Robot\nIdling, Release\nBrake, Robot\nOperational
  const [isNetworkConnected, setIsNetworkConnected] = useState(false);
  const [isRobotConnected, setIsRobotConnected] = useState(false);
  const [isRobotPoweredOn, setIsRobotPoweredOn] = useState(false);
  const [robotProgramStatus, setRobotProgramStatus] = useState("Not Available"); // ["Not Available","Running", "Stopped", "Initializing"]
  const [robotControlMode, setRobotControlMode] = useState("not available"); // ["Unknown","remote", "local"]

  const [selectedServer, setSelectedServer] = useState("aws");
  const [serverEndpoint, setServerEndpoint] = useState("https://api.portal301.com");
  // const [robotEndPoint, setRobotEndPoint] = useState("192.167.0.3");
  const [robotEndPoint, setRobotEndPoint] = useState("192.168.0.68");

  console.log("app created");
  const [messages, setMessages] = useState([]);
  // const [messageInput, setMessageInput] = useState('');
  const inputRef = useRef(null);

  const [robotProfile, setRobotProfile] = useState({
    "Robot Name": "KARI Robot 1",
    "Hardware": "UR5e",
    "Installed At": "2023-12-01",
    "Serial Number": "xxx-xxx-xxxx-xxxx",
    "MAC Address": "xx:xx:xx:xx:xx:xx"
  }); 


  useEffect(() => {
    // Use useEffect to run the setup only once when the component mounts
    const handleChatMessage = (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    };
    console.log("useEffect")

    socket.emit('settings', {robotProfile: null});

    // Attach the event listener
    socket.on('chat message', handleChatMessage);

    socket.on('robot-dashboard', (args) => {
      console.log("robot-dashboard(socket): ", args);
      
      if (args.hasOwnProperty("robotProfile")) {
        let profile = {};
        if(args.robotProfile.hasOwnProperty("alias")){
          profile["Robot Name"] = args.robotProfile.alias;
        }
        if(args.robotProfile.hasOwnProperty("hardware")){
          profile["Hardware"] = args.robotProfile.hardware;
        }
        if(args.robotProfile.hasOwnProperty("serialNumber")){
          profile["Serial Number"] = args.robotProfile.serialNumber;
        }
        if(args.robotProfile.hasOwnProperty("serialNumber")){
          profile["MAC Address"] = args.robotProfile.serialNumber;
        }
        if(args.robotProfile.hasOwnProperty("createdAt")){
          profile["Installed At"] = args.robotProfile.createdAt;
        }
        setRobotProfile(profile);
      }
      // for(let key in robotProfile){
      //   if(args.robotProfile.hasOwnProperty(key)){
      //     profile[key] = args.robotProfile[key];
      //   }
      // }

      if (args.hasOwnProperty("isNetworkConnected")) {
        setIsNetworkConnected(args.isNetworkConnected);
      } 
      if (args.hasOwnProperty("isRobotConnected")) {
        setIsRobotConnected(args.isRobotConnected);
      } 
      // if (args.hasOwnProperty("isRobotPoweredOn")) {
      //   setIsRobotPoweredOn(args.isRobotPoweredOn);
      // }
      if (args.hasOwnProperty("robotOperationStatus")) {
        setRobotOperationStatus(args.robotOperationStatus);
        if(args.robotOperationStatus > ROBOT_OPERATION_STATUS_POWER_OFF){
          setIsRobotPoweredOn(true);
          console.log("setIsRobotPoweredOn(true)");
        }else{
          setIsRobotPoweredOn(false);
          console.log("setIsRobotPoweredOn(false)");
        }
      } 
      if (args.hasOwnProperty("robotControlMode")) {
        setRobotControlMode(args.robotControlMode);
      }
      if (args.hasOwnProperty("robotProgramStatus")) {
        setRobotProgramStatus(args.robotProgramStatus);
        if (args.robotProgramStatus==="Running") {
          setStartingTime(new Date());
          // setProgramState("running");
        } else {
          // setProgramState("stopped");
        }
        // setStartingTime(new Date());
        // setIsRobotProgramRunning(true);
        // setProgramState("running");
      }
      if (args.speedSlider) {
        setSliderValue(args.speedSlider);
      }



    });

    // Cleanup: Remove the event listener when the component unmounts
    return () => {
      socket.off('chat message', handleChatMessage);
    };
  }, [socket]); // Run the effect when the socket instance changes (component mounts or unmounts)

  const sendMessage = (e) => {
    e.preventDefault();

    // Access the value of the input directly using the ref
    const messageInputValue = inputRef.current.value;

    // Emit a 'chat message' event to the Socket.IO server
    socket.emit('chat message', messageInputValue);

    // Optionally, you can clear the input field
    inputRef.current.value = '';
  };


  // const {ipcRenderer} = window.require('electron');
  // const sendMain = () => {
  //   // ipcRenderer.send(SEND_MAIN_PING, "Hello from React!")
  // }

  const [version, setVersion] = useState("123");
  const [files, setFiles] = useState([]);


  useEffect(() => {
    ipcRenderer.send("app_version");

    ipcRenderer.on("app_version", (event, args) => {
      setVersion(args.version);
      console.log("args.version: ", args.version);
    });

    // ipcRenderer.on("files", (event, args) => {
    //   setFiles(args.files);
    // });

    ipcRenderer.on("robot-dashboard", (event, args) => {
      console.log("robot-dashboard: ", args);
      if (args.hasOwnProperty("robotProfile")) {
        setRobotProfile(args.robotProfile);
      }
    })
  }, []);



  const onChange = (e) => {
    console.log("onSelect")
    console.log(e.target.value);
    setSelectedServer(e.target.value);
    setServerEndpoint(e.target.value === "aws" ? "https://api.portal301.com" : "http://localhost:8080")
  }

  const sioHeader = "robot";

  const getTimeString = (time) => {
    const hours = time.getUTCHours().toString().padStart(2, '0');
    const minutes = time.getUTCMinutes().toString().padStart(2, '0');
    const seconds = time.getUTCSeconds().toString().padStart(2, '0');
    

    return `${hours}:${minutes}:${seconds}`;
  }

  const onStartStreammingBtnClick = () => {
    ipcRenderer.send("runExternalProcess");
  }

  const onConnectBtnClick = () => {
    const requestForm = {
        connect: true,
        endpoint: {
          network: serverEndpoint,
          robot: robotEndPoint  
        }
      };
    console.log("connectionRequestForm: ", requestForm);
    ipcRenderer.send("robot-dashboard-request", requestForm);
    socket.emit(sioHeader, requestForm);
  }
  const onDisconnectBtnClick = () => {
    const requestForm = {
        connect: false
      };
    socket.emit(sioHeader, requestForm);

  }
  const onPowerOnBtnClick = () => {
    const requestForm = {
        power: true
      };

    socket.emit(sioHeader, requestForm);

  }
  const onPowerOffBtnClick = () => {
    const requestForm = {
        power: false
      };
    socket.emit(sioHeader, requestForm);

  }
  const onStartProgramBtnClick = () => {
    const requestForm = {
        program: "start"
      };
    socket.emit(sioHeader, requestForm);
  }
  const onStopProgramBtnClick = () => {
    const requestForm = {
        program: "stop"
      };
    socket.emit(sioHeader, requestForm);
  }

  const [startingTime, setStartingTime] = useState(new Date(0));
  const [elapsedTime, setRunningTime] = useState(new Date(0));
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (robotProgramStatus === "Running") {
        const currentTime = new Date();
        setRunningTime(new Date(currentTime - startingTime));
      }
      return;
    }, 1000);
  
    return () => clearInterval(interval);
  }, [robotProgramStatus, elapsedTime, startingTime]);

  const [sliderValue, setSliderValue] = useState(50);

  const handleSliderChange = (event) => {
    setSliderValue(event.target.value);
    const requestForm = {
      io: {
        speedSlider: parseFloat(event.target.value)/100.0
      }
    };
    console.log("speedSlider: ", requestForm);
    socket.emit(sioHeader, requestForm);
  };

  return (
    <div className="App">
      <div className="bg-white w-full h-full flex flex-col items-center py-[1rem] px-[8rem]">
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
        <div className="flex">
          <SectionLevel1>
            <div className="text-3xl font-bold mb-[1rem] text-start w-full">System Configuration</div>
            <div className = "flex flex-col items-center w-[28rem]">

              <SectionLevel2 title="Camera Profile" className="w-full mt-[1rem]">
                <div className="w-full pl-[1rem]">
                  {
                    Object.entries(robotProfile).map( ([key, value]) => {
                      return (
                        <FieldText field={key} content={value} />
                      )
                    })
                  }
                </div>
              </SectionLevel2>

              <SectionLevel2 title="Network" className="w-full mt-[4rem]">
                <div className="text-start w-full pl-[1rem]">
                  <FieldSelector field="Server">
                    <select id="serverSelect" value={selectedServer} onChange={onChange} className="w-full h-full text-md text-start font-bold shadow-sm border border-1 border-[#CCF] rounded-lg px-[1rem] bg-[#FAFAFA]">
                      <option value="intranet">Intranet server</option>
                      <option value="aws">AWS public server</option>
                    </select>
                  </FieldSelector>
                  {
                  selectedServer === "intranet" 
                    ? (<FieldInput field="EndPoint" input="https://127.0.0.1:3333" width="14rem" />) 
                    : (<FieldText field="EndPoint" content="https://api.portal301.com" />)
                  }
                </div>
              </SectionLevel2>
              <SectionLevel2 title="Robot Connectivity" className="w-full mt-[6rem]">
                <div className="w-full pl-[1rem]">
                  <FieldInput field="Robot IP" input={robotEndPoint} width="14rem"/>
                </div>
              </SectionLevel2>
              <SectionLevel2 title="Robot Profile" className="w-full mt-[8rem]">
                <div className="w-full pl-[1rem]">
                  {
                    Object.entries(robotProfile).map( ([key, value]) => {
                      return (
                        <FieldText field={key} content={value} />
                      )
                    })
                  }
                </div>
              </SectionLevel2>

              
            </div>
          </SectionLevel1>

          <div className="flex flex-col gap-[1rem]">
            <SectionLevel1>
              <div className="bg-[white] w-full h-[28rem] flex flex-col p-[1rem] rounded-xl border border-2 border-gray">
                <div className="text-3xl">Camera Section</div>
                <button className="bg-[#ACF] w-[12rem] h-[5rem] rounded-xl shadow-md text-2xl text-[white] m-[0.2rem]" onClick={onStartStreammingBtnClick}>Start Streaming</button>
                <button className="bg-[#ACF] w-[12rem] h-[5rem] rounded-xl shadow-md text-2xl text-[white] m-[0.2rem]" onClick={onStartStreammingBtnClick}>Disconnect</button>
              </div>
            </SectionLevel1>

            <SectionLevel1>
              <div className = "flex flex-col items-center w-[70rem]">
                <div className="flex">
                  <div className="flex flex-col items-center w-[30rem]">
                  <SectionLevel2 title="Connection" className="w-[30rem]">
                    <div className="w-full pl-[1rem]">
                      <FieldText field="Network" content={isNetworkConnected?"Connected":"Disconnected"} />
                      <FieldText field="Robot" content={isRobotConnected?"Connected":"Disconnected"} />
                    </div>
                    <div className="w-full mt-[1rem] flex justify-center">
                      <CustomButton title="Connect" onClick={onConnectBtnClick} isButtonEnabled={!isRobotConnected}/>
                      <CustomButton title="Disconnect" onClick={onDisconnectBtnClick} isButtonEnabled={isRobotConnected}/>
                    </div>
                    </SectionLevel2>
                    <SectionLevel2 title="Operation Status" className="w-[30rem] mt-[2rem]" enable={isRobotConnected}>
                      <div className = "mt-[1rem]">
                        <RobotModeIndicatorSection status={robotOperationStatus}/>
                        <div className = "flex justify-center pl-[3rem] mt-[1rem]">
                          <FieldText field="Control Mode" content={robotControlMode} />
                        </div>
                        <div className="mt-[1rem]">
                          <CustomButton title="Power On" onClick={onPowerOnBtnClick} isButtonEnabled={isRobotConnected && !isRobotPoweredOn}/>
                          <CustomButton title="Power Off" onClick={onPowerOffBtnClick} isButtonEnabled={isRobotConnected  && isRobotPoweredOn}/>
                        </div>
                      </div>
                    </SectionLevel2>

                  </div>

                  <SectionLevel2 title="Program" className="w-[30rem] ml-[2rem]" enable={isRobotConnected && robotOperationStatus === ROBOT_OPERATION_STATUS_ROBOT_OPERATIONAL}>
                    <div className="w-full pl-[1rem]">
                      <FieldText field="Name" content="ContinuousServoJ" />
                      <FieldText field="Version" content="1.1.0" />
                      <FieldText field="Status" content={robotProgramStatus} />
                      <FieldText field="Starting Time" content={getTimeString(startingTime)} />
                      <FieldText field="Running Time" content={getTimeString(elapsedTime)} />
                      <div className="mt-[2rem]">
                        <FieldText field="Speed Slider" content={`${sliderValue} %`} />
                        <input
                          type="range"
                          id="slider"
                          min="0"
                          max="100"
                          step="1"
                          value={sliderValue}
                          onChange={handleSliderChange}
                          className="w-[24rem] mt-[0.5rem]"
                        />
                      </div>

                    </div>
                    <div className="mt-[2rem]">
                    {/* <CustomButton title="Start" onClick={onStartProgramBtnClick} isButtonDisabled={((!isRobotConnected) || (!isRobotPoweredOn)) && (robotProgramStatus === "running")}/> */}
                    <CustomButton title="Start" onClick={onStartProgramBtnClick} isButtonEnabled={(isRobotConnected && isRobotPoweredOn) && (robotProgramStatus === "Stopped")}/>
                      <CustomButton title="Stop" onClick={onStopProgramBtnClick} isButtonEnabled={(isRobotConnected && isRobotPoweredOn) && (robotProgramStatus === "Running")}/>
                    </div>

                  </SectionLevel2>
                </div>

              </div>
              </SectionLevel1>
            </div>

          </div>
        {/* <img src={logo} className="App-logo" alt="logo" />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a> */}
      </div>

    </div>
  );
}



export default App;
