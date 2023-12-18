import React, { useState, useEffect } from 'react';
import { CustomButton, SectionLevel1, SectionLevel2, FieldSelector, FieldInput, FieldText, RobotModeIndicatorSection, LedIndicator} from './elements'
const {ipcRenderer} = window;


const ConfigSection = ({onEndpointUpdate, moduleProfile, endpoints, onConfigEdit}) => {
    const [selectedServer, setSelectedServer] = useState("");
    const [isConfigEditted, setIsConfigEditted] = useState(false);

    useEffect(() => {
      setSelectedServer(endpoints.remote[0].name);

    }, [endpoints]);

    let config = {
      moduleProfile: moduleProfile,
      endpoints: endpoints
    }

    let serverEndpoint = config.endpoints.remote[0].address;
    let robotEndpoint = config.endpoints.robot[0].address;


    console.log("selectedServer: ", selectedServer)
    const onChangeRobotIP = (e) => {
      setIsConfigEditted(true);
      config.endpoints.robot[0].address = e.target.value;
      onEndpointUpdate({
        server:serverEndpoint, 
        robot:e.target.value
      });
    }
    const onChangeIntranetIP = (e) => {
      setIsConfigEditted(true);
      config.endpoints.remote[0].address = e.target.value;
      serverEndpoint = e.target.value;
      onEndpointUpdate({
        server:e.target.value,
        robot:robotEndpoint
      });
      console.log('target.value: ', e.target.value);
    }

    let robotProfile = {
        "Robot Name": "not loaded",
        "Hardware": "not loaded",
        "Installed At": "not loaded",
        "Serial Number": "not loaded",
        "MAC Address": "not loaded"
  
    }
  
    const [version, setVersion] = useState("123");
    const [files, setFiles] = useState([]);
 

    if (moduleProfile.hasOwnProperty("robot")) {
        const robotProfile2 = moduleProfile.robot;
        console.log("robotProfile: ", robotProfile2)
        if(robotProfile2.hasOwnProperty("alias")){
            robotProfile["Robot Name"] = robotProfile2.alias; // == moduleProfile.robot.alias
        }
        if(robotProfile2.hasOwnProperty("hardware")){
            robotProfile["Hardware"] = robotProfile2.hardware;
        }
        if(robotProfile2.hasOwnProperty("serialNumber")){
            robotProfile["Serial Number"] = robotProfile2.serialNumber;
        }
        if(robotProfile2.hasOwnProperty("serialNumber")){
            robotProfile["MAC Address"] = robotProfile2.serialNumber;
        }
        if(robotProfile2.hasOwnProperty("createdAt")){
            robotProfile["Installed At"] = robotProfile2.createdAt;
        }
    }
  
    const onSaveBtnClick = () => {
      console.log("onSaveBtnClick");
      setIsConfigEditted(false);
      onConfigEdit(config);
    }
  
    const onChange = (e) => {
      console.log("onSelect", e.target.value)
      
      // selectedServer = e.target.value;
      setSelectedServer(e.target.value);
      for (let i = 0; i < endpoints.remote.length; i++) {
        if (endpoints.remote[i].name === e.target.value) {
          serverEndpoint = endpoints.remote[i].address;
          // setServerEndpoint(endpoints.remote[i].address);
          onEndpointUpdate({
            server:endpoints.remote[i].address, 
            robot:robotEndpoint
          });
        }
      }
    }
  

    return (
      <SectionLevel1>
        <div className="text-3xl font-bold mb-[1rem] text-start w-full">System Configuration</div>
        <div className = "flex flex-col items-center w-[28rem]">
  
          <SectionLevel2 title="Camera Profile" className="w-full mt-[1rem]">
            <div className="w-full pl-[1rem]">
              {
                Object.entries(robotProfile).map( ([key, value]) => {
                  return (
                    <FieldText key={key} field={key} content={value} />
                  )
                })
              }
            </div>
          </SectionLevel2>
  
          <SectionLevel2 title="Remote Connectivity" className="w-full mt-[4rem]">
            <div className="text-start w-full pl-[1rem]">
              <FieldSelector field="Server">
                <select id="serverSelect" value={selectedServer} onChange={onChange} className="w-full h-full text-md text-start font-bold shadow-sm border border-1 border-[#CCF] rounded-lg px-[1rem] bg-[#FAFAFA]">
                {endpoints.remote.map((endpoint, index) => (
                  <option key={index} value={endpoint.name}>
                    {endpoint.name}
                  </option>
                ))}
                </select>
              </FieldSelector>
              {
                endpoints.remote.map((endpoint) => (
                  endpoint.name === selectedServer
                  ?(endpoint.isEditable === true
                    ?(<FieldInput key={endpoint.name} field="EndPoint" input={endpoint.address} width="14rem" onChange={onChangeIntranetIP}/>)
                    :(<FieldText key={endpoint.name} field="EndPoint" content={endpoint.address} />)
                  )
                  : null
                ))
              }
            </div>
          </SectionLevel2>
          <SectionLevel2 title="Robot Connectivity" className="w-full mt-[6rem]">
            <div className="w-full pl-[1rem]">
              <FieldInput field="Robot IP" input={robotEndpoint} width="14rem" onChange={onChangeRobotIP}/>
            </div>
          </SectionLevel2>
          <SectionLevel2 title="Robot Profile" className="w-full mt-[8rem]">
            <div className="w-full pl-[1rem]">
              {
                Object.entries(robotProfile).map( ([key, value]) => {
                  return (
                    <FieldText key={key} field={key} content={value} />
                  )
                })
              }
            </div>
          </SectionLevel2>
          <div className="w-full mt-[5rem]">
            <CustomButton title="Save" onClick={onSaveBtnClick} isButtonEnabled={isConfigEditted} size={"w-full h-[3.5rem]"}/>
          </div>
        </div>
      </SectionLevel1>
    )
  }

const RobotSection = ({socket, endpoint}) => {
    const ROBOT_OPERATION_STATUS_UNKNOWN = 0;
    const ROBOT_OPERATION_STATUS_POWER_OFF = 1;
    const ROBOT_OPERATION_STATUS_POWER_ON = 2;
    const ROBOT_OPERATION_STATUS_BOOTING = 3;
    const ROBOT_OPERATION_STATUS_ROBOT_IDLING = 4;
    const ROBOT_OPERATION_STATUS_RELEASING_BRAKE = 5;
    const ROBOT_OPERATION_STATUS_ROBOT_OPERATIONAL = 6;
  
    const [robotOperationStatus, setRobotOperationStatus] = useState(0); //  Power Off,  Booting, Robot\nIdling, Release\nBrake, Robot\nOperational
    const [isNetworkConnected, setIsNetworkConnected] = useState(false);
    const [isRobotConnected, setIsRobotConnected] = useState(false);
    const [isRobotPoweredOn, setIsRobotPoweredOn] = useState(false);
    const [robotProgramStatus, setRobotProgramStatus] = useState("Not Available"); // ["Not Available","Running", "Stopped", "Initializing"]
    const [robotControlMode, setRobotControlMode] = useState("not available"); // ["Unknown","remote", "local"]
  
  
    useEffect(() => {
      // Use useEffect to run the setup only once when the component mounts
      console.log("useEffect")
  
      socket.emit('settings', {robotProfile: null});
  
  
      socket.on('robot-dashboard', (args) => {
        // console.log("robot-dashboard(socket): ", args);
  
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
        // socket.off('chat message', handleChatMessage);
      };
    }, [socket]); // Run the effect when the socket instance changes (component mounts or unmounts)
  
  
    const sioHeader = "robot";
  
  
  
    const onConnectBtnClick = () => {

      
      const requestForm = {
          connect: true,
          endpoint: {
            network: endpoint.server,
            robot: endpoint.robot  
          }
        };
      console.log("connectionRequestForm: ", requestForm);
      ipcRenderer.send("robot-dashboard-request", requestForm);
      // socket.emit(sioHeader, requestForm);
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
    const getTimeString = (time) => {
      const hours = time.getUTCHours().toString().padStart(2, '0');
      const minutes = time.getUTCMinutes().toString().padStart(2, '0');
      const seconds = time.getUTCSeconds().toString().padStart(2, '0');
      
      return `${hours}:${minutes}:${seconds}`;
    }
  
    return (
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
                <FieldText field="Name" content="MotionSync.urp" />
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
    )
  }

export {
    RobotSection,
    ConfigSection
};