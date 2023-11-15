import { useEffect, useState } from "react";
import logo from './logo.svg';
import './App.css';
import {SEND_MAIN_PING} from './constants'

const {ipcRenderer} = window;

function App() {

  // const {ipcRenderer} = window.require('electron');
  // const sendMain = () => {
  //   // ipcRenderer.send(SEND_MAIN_PING, "Hello from React!")
  // }

  const [version, setVersion] = useState("123");
  const [files, setFiles] = useState([]);

  const [robotProfile, setRobotProfile] = useState({
    "Robot Name": "KARI Robot 1",
    "Hardware": "UR5e",
    "First Installed": "2023-12-01",
    "Serial Number": "xxx-xxx-xxxx-xxxx",
    "MAC address": "xx:xx:xx:xx:xx:xx"
  }); 

  const [robotOperationStatus, setRobotOperationStatus] = useState(0); //  Power Off,  Booting, Robot\nIdling, Release\nBrake, Robot\nOperational
  const [isNetworkConnected, setIsNetworkConnected] = useState(false);
  const [isRobotConnected, setIsRobotConnected] = useState(false);
  const [isRobotPoweredOn, setIsRobotPoweredOn] = useState(false);
  const [isProgramRunning, setIsProgramRunning] = useState(false);
  const [robotControlMode, setRobotControlMode] = useState("Not Available"); // ["Unknown","Remote", "Local"]

  useEffect(() => {
    ipcRenderer.send("app_version");

    ipcRenderer.on("app_version", (event, args) => {
      setVersion(args.version);
      console.log("args.version: ", args.version);
    });

    ipcRenderer.on("hello", (event, args) => {
      console.log("hello request received")
      console.log(args)
    });

    ipcRenderer.on("files", (event, args) => {
      setFiles(args.files);
    });


    ipcRenderer.on("robot-dashboard", (event, args) => {
      console.log("robot-dashboard: ", args);
      if (args.robotProfile) {
        setRobotProfile(args.robotProfile);
      }


      if (args.isNetworkConnected) {
        setIsNetworkConnected(args.isNetworkConnected);
      } 
      if (args.isRobotConnected) {
        setIsRobotConnected(args.isRobotConnected);
      } 
      if (args.isRobotPoweredOn) {
        setIsRobotPoweredOn(args.isRobotPoweredOn);
      }
      if (args.robotOperationStatus) {
        setRobotOperationStatus(args.robotOperationStatus);
      } 
      if (args.robotControlMode) {
        setRobotControlMode(args.robotControlMode);
      }
      if (args.isProgramRunning) {
        setIsProgramRunning(args.isProgramRunning);
      }
      if (args.speedSlider) {
        setSliderValue(args.speedSlider);
      }

    })
  }, []);


  const [selectedServer, setSelectedServer] = useState("aws");
  const [serverEndpoint, setServerEndpoint] = useState("https://api.portal301.com");
  const [robotEndPoint, setRobotEndPoint] = useState("192.167.0.3");

  const onChange = (e) => {
    console.log("onSelect")
    console.log(e.target.value);
    setSelectedServer(e.target.value);
    setServerEndpoint(e.target.value === "aws" ? "https://api.portal301.com" : "http://localhost:8080")
  }

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

    const requestForm = [
      {
        command: "connect",
        endpoint: {
          network: serverEndpoint,
          robot: robotEndPoint  
        }
      }
    ];

    console.log("connectionRequestForm: ", requestForm);

    ipcRenderer.send("robot-dashboard-request", requestForm);
    setIsRobotConnected(true);
    setRobotOperationStatus(1);
    setRobotControlMode("Remote");
  }
  const onDisconnectBtnClick = () => {
    const requestForm = [
      {
        command: "disconnect"
      }
    ];
    ipcRenderer.send("robot-dashboard-request",requestForm);
    setIsRobotConnected(false);
    setRobotOperationStatus(0);
    setRobotControlMode("Not Available");
  }
  const onPowerOnBtnClick = () => {
    const requestForm = [
      {
        command: "powerOn"
      }
    ];
    ipcRenderer.send("robot-dashboard-request",requestForm);
    setIsRobotPoweredOn(true);
    setRobotOperationStatus(5);
  }
  const onPowerOffBtnClick = () => {
    const requestForm = [
      {
        command: "powerOff"
      }
    ];
    ipcRenderer.send("robot-dashboard-request",requestForm);
    setIsRobotPoweredOn(false);
    setRobotOperationStatus(1);
  }
  const onStartProgramBtnClick = () => {
    const requestForm = [
      {
        command: "startProgram"
      }
    ];
    ipcRenderer.send("robot-dashboard-request",requestForm);
    console.log("onClickStartProgramBtn");
    setStartingTime(new Date());
    setIsProgramRunning(true);
    setProgramState("running");
  }
  const onStopProgramBtnClick = () => {
    const requestForm = [
      {
        command: "stopProgram"
      }
    ];
    ipcRenderer.send("robot-dashboard-request",requestForm);
    console.log("onClickStopProgramBtn");
    setProgramState("stopped");
    setIsProgramRunning(false);
  }

  const [programState, setProgramState] = useState("stopped"); // ["stopped", "running", "paused"]
  const [startingTime, setStartingTime] = useState(new Date(0));
  const [elapsedTime, setRunningTime] = useState(new Date(0));
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (programState === "running") {
        const currentTime = new Date();
        setRunningTime(new Date(currentTime - startingTime));
      }
      return;
    }, 1000);
  
    return () => clearInterval(interval);
  }, [programState, elapsedTime, startingTime]);

  const [sliderValue, setSliderValue] = useState(50);

  const handleSliderChange = (event) => {
    setSliderValue(event.target.value);
  };

  return (
    <div className="App">
      <div className="bg-white w-full h-full flex flex-col items-center py-[1rem] px-[8rem]">
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
                      <CustomButton title="Connect" onClick={onConnectBtnClick} isButtonDisabled={isRobotConnected}/>
                      <CustomButton title="Disconnect" onClick={onDisconnectBtnClick} isButtonDisabled={!isRobotConnected}/>
                    </div>
                    </SectionLevel2>
                    <SectionLevel2 title="Operation Status" className="w-[30rem] mt-[2rem]" enable={isRobotConnected}>
                      <div className = "mt-[1rem]">
                        <RobotModeIndicatorSection status={robotOperationStatus}/>
                        <div className = "flex justify-center pl-[3rem] mt-[1rem]">
                          <FieldText field="Control Mode" content={robotControlMode} />
                        </div>
                        <div className="mt-[1rem]">
                          <CustomButton title="Power On" onClick={onPowerOnBtnClick} isButtonDisabled={!(isRobotConnected && !isRobotPoweredOn)}/>
                          <CustomButton title="Power Off" onClick={onPowerOffBtnClick} isButtonDisabled={!(isRobotConnected  && isRobotPoweredOn)}/>
                        </div>
                      </div>
                    </SectionLevel2>

                  </div>

                  <SectionLevel2 title="Program" className="w-[30rem] ml-[2rem]" enable={isRobotConnected && isRobotPoweredOn}>
                    <div className="w-full pl-[1rem]">
                      <FieldText field="Name" content="ContinuousServoJ" />
                      <FieldText field="Version" content="1.1.0" />
                      <FieldText field="Status" content="Running" />
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
                      <CustomButton title="Start" onClick={onStartProgramBtnClick} isButtonDisabled={!(isRobotConnected && isRobotPoweredOn && !isProgramRunning)}/>
                      <CustomButton title="Stop" onClick={onStopProgramBtnClick} isButtonDisabled={!(isRobotConnected && isRobotPoweredOn && isProgramRunning)}/>
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

const CustomButton = ({ title, onClick, isButtonDisabled, themeColor}) => {
  return (
    <button 
      onClick={onClick}
      disabled={isButtonDisabled}
      className={`w-[10rem] h-[5rem] font-bold py-2 px-4 rounded text-white
      ${themeColor==='darkblue'
        ? 'bg-blue-900 hover:bg-blue-700'
        : themeColor==='red'
        ? 'bg-red-500 hover:bg-red-700'
        : 'bg-blue-500 hover:bg-blue-700' }

      ${isButtonDisabled ? 'opacity-20 cursor-not-allowed' : ''}
      `}
    >
      {title}
    </button>
  );
};

const SectionLevel1 = ({ title, children }) => {

  return (
    <div class = "flex flex-col items-center p-[1rem] bg-[white] border-[#F5F5FA] border-[0.15rem] rounded-xl shadow-md mx-[0.5rem]">
      {title? <div class="text-3xl font-bold">{title}</div> : null}
      <div class="w-full mt-[0.5rem]">
        {children}
      </div>
    </div>
  );
};


const SectionLevel2 = ({ title, children, enable=true,...props }) => {

  return (
    <div className={`flex flex-col items-center mx-[0.5rem] ${props.className}`}>
        <div className={`drop-shadow-md w-full flex justify-start items-center`}>
          <div class="mr-[0.5rem] text-lg font-bold whitespace-pre">{title}</div>
          <div class="w-full h-[2px] bg-black rounded-full"></div>
        </div>
        <div class={`w-full mt-[0.5rem] ${enable===true? "":"opacity-30"}`}>
          {children}
        </div>
      </div>
  );
};



const FieldSelector = ({ field, children, color }) => {
  return (
    <div className="w-fit h-[1.8rem] flex rounded-sm my-[0.2rem]">
      <div className="w-[8rem] h-full text-md text-start truncate font-bold">{field}</div>
      <div class="w-[1rem] h-full font-bold">:</div>
      <div className="w-[14rem] text-md font-bold">{children}</div>
    </div>
  );
};

const FieldInput = ({ field, input, width }) => {
  const widthInput = width? width : "10rem";

  return (
    <div className="w-fit h-[1.8rem] flex rounded-sm my-[0.2rem]">
      <div className="w-[8rem] h-full text-md text-start truncate font-bold">{field}</div>
      <div className="w-[1rem] h-full font-bold">:</div>
      {/* <input className="w-[12rem] h-full text-md text-start font-bold shadow-sm border border-1 border-[#CCF] rounded-lg px-[1rem] bg-[#FAFAFA]" type="text" id="fname" name="fname" value={input} /> */}
      <input className={`w-[${widthInput}] h-full text-md text-start font-bold shadow-sm border border-1 border-[#CCF] rounded-lg px-[1rem] bg-[#FAFAFA]`} type="text" id="fname" name="fname" value={input} />
    </div>
  );
};


const FieldText = ({ field, content, color }) => {
  return (
    <div className="w-fit h-[1.8rem] flex justify-start rounded-sm my-[0.2rem]">
      <div 
        className="w-[8rem] h-full text-md text-start truncate font-bold">{field}</div>
      <div className="w-[1rem] h-full font-bold">:</div>
      <div className="w-[10rem] h-full ml-[1rem] text-md text-start rounded-sm"> {content}</div>
    </div>
  );
};


const RobotModeIndicatorSection = ({status}) => {
  let indicators = [
    {title: "Power Off", color: "#AAA"},
    {title: "Booting", color: "#AAA"},
    {title: "Robot\nIdling", color: "#AAA"},
    {title: "Release\nBrake", color: "#AAA"},
    {title: "Robot\nOperational", color: "#AAA"},
  ];

  if (status === 1) {
    indicators[0].color = "#F00";
  } else if (status === 2) {
    indicators[0].color = "#0F0";
    indicators[1].color = "#FF0";
  } else if (status === 3) {
    indicators[0].color = "#0F0";
    indicators[1].color = "#0F0";
    indicators[2].color = "#FF0";
  } else if (status === 4) {
    indicators[0].color = "#0F0";
    indicators[1].color = "#0F0";
    indicators[2].color = "#0F0";
    indicators[3].color = "#FF0";
  } else if (status === 5) {
    indicators[0].color = "#0F0";
    indicators[1].color = "#0F0";
    indicators[2].color = "#0F0";
    indicators[3].color = "#0F0";
    indicators[4].color = "#0F0";
  }


  return (
    <div className="flex w-full justify-center">
      {
        indicators.map( item => {
          return (
            <LedIndicator text={item.title} color={item.color}/>
          )
        })
      }
    </div>
  );
}

const LedIndicator = ({ text, color }) => {
  const bgColor = Array.isArray(color) ? color[0] : color;

  return (
    <div className="w-[6rem] flex flex-col items-center">
      <div
        style={{ backgroundColor: bgColor }}
        className="rounded-full shadow-md w-[3rem] h-[3rem]"
      ></div>
      <div className="text-md font-bold w-full whitespace-pre">{text}</div>
    </div>
  );
};




export default App;
