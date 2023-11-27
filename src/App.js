import { useEffect, useState, useRef } from "react";
import logo from './logo.svg';
import './App.css';
import { SEND_MAIN_PING } from './constants'

import { CustomButton, SectionLevel1, SectionLevel2, FieldSelector, FieldInput, FieldText, RobotModeIndicatorSection, LedIndicator } from './component/elements'
import { RobotSection, ConfigSection } from './component/sections';

import io from 'socket.io-client';


const { ipcRenderer } = window;
const VERSION = "portalComm_v0.1"

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
});

const cameraSocket = io('https://localhost:3333', {
  transports: ['websocket'],
  path: `/${VERSION}`
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
        console.log("moduleProfile: ", args.moduleProfile);
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
          <ConfigSection onEndpointUpdate={onEndpointUpdate} moduleProfile={moduleProfile} />
          <div className="flex flex-col gap-[1rem]">
            <CameraSection />
            <RobotSection socket={socket} endpoint={{ server: serverEndpoint, robot: robotEndPoint }} />
          </div>
        </div>
      </div>
    </div>
  );
}



const CameraSection = () => {

  useEffect(() => {

    return () => {
    };
  }, []);


  return (
    <SectionLevel1>
      <div className="flex flex-col items-center w-[41rem]">
        <div className="flex">
          <div className="flex flex-col items-center w-[12rem]">
            <div className="w-full pl-[1rem]">
              <CustomButton title="Start" size={'w-[10rem] h-[7rem]'} onClick={() => {
                cameraSocket.emit("echo", 'KARI-CAM-0001');
              }} />
              <CustomButton title="Exit" size={'w-[10rem] h-[7rem]'} onClick={() => {
                let zedSetting = { targetSetting: 'system', value: 'sys_exit'};
                cameraSocket.emit("zed:command", 'KARI-CAM-0001', zedSetting);

                // cameraSocket.emit("sys_exit");
              }}/>
              <CustomButton title="Reboot" size={'w-[10rem] h-[7rem]'} />
            </div>
          </div>

          <SectionLevel2 title="Camera Settings" className="w-[30rem] ml-[2rem]">
            <FieldText field="Model" content={"Zed2 Mini"} />
            <FieldText field="Resolution" content={"1280 x 720"} />
            <FieldText field="Depth Mode" content={"8bit"} />
            <FieldText field="Max Distance" content={"3m"} />
            <div className="w-full pl-[1rem]">
              <div className="mt-[2rem]">
                <SectionLevel2 title="Command" className="w-[40rem] ml-[-1rem]">
                  <div className="w-fit h-[1.8rem] flex justify-start rounded-sm my-[0.2rem]">
                    <div
                      className="w-[11rem] h-full text-md text-start truncate font-bold">Sensing Depth Mode</div>
                  </div>

                  <div className="w-full mt-[1rem] flex justify-center">
                    <CustomButton title="8 bit" onClick={() => {
                      console.log('bit 8..')
                      let zedSetting = { targetSetting: 'bit', value: 8 };
                      cameraSocket.emit("echo", 'KARI-CAM-0001');
                      cameraSocket.emit("zed:command", 'KARI-CAM-0001', zedSetting);
                      // visibleRangeRef.current.bitDepth = 8.0;
                    }} />
                    <CustomButton title="12 bit" onClick={() => {
                      let zedSetting = { targetSetting: 'bit', value: 12 };
                      cameraSocket.emit("zed:command", 'KARI-CAM-0001', zedSetting);
                      // visibleRangeRef.current.bitDepth = 8.0;
                    }} />
                  </div>
                  <FieldText field="Max Distance" content={'3m'} />
                  <input
                    type="range"
                    id="slider"
                    min="0"
                    max="100"
                    step="1"
                    // value={sliderValue}
                    // onChange={handleSliderChange}
                    className="w-[20rem] mt-[0.5rem]"
                  />
                </SectionLevel2>

              </div>


            </div>
            <div className="mt-[2rem]">

            </div>
          </SectionLevel2>
        </div>

      </div>
    </SectionLevel1>

  )
}


export default App;

