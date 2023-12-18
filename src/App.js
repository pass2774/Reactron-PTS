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

const cameraSocket = io('https://localhost:3333', { // camera socket server
  transports: ['websocket'],
  path: `/${VERSION}`
});



function App() {
  const [moduleProfile, setModuleProfile] = useState({});
  const [serverEndpoint, setServerEndpoint] = useState("https://api.portal301.com");
  const [robotEndPoint, setRobotEndPoint] = useState("");
  const [closing, setClosing] = useState(false);

  const [endpoints, setEndpoints] = useState(      {
    "remote": [
      {},
    ],
    "robot": [
      {}
    ]
  });
  console.log("app created");


  useEffect(() => {
    // ipcRenderer.send("app_version");
    // ipcRenderer.on("files", (event, args) => {
    //   setFiles(args.files);
    // });

    const requestForm = {
      moduleProfile: {header:"get"},
      endpoints: {header:"get"}
    };
    console.log("connectionRequestForm: ", requestForm);
    ipcRenderer.send("robot-dashboard-request", requestForm);

    ipcRenderer.on("close-default", (event, args) => {
      setClosing(true);
    });

    ipcRenderer.on("robot-dashboard", (event, args) => {
      console.log("robot-dashboard: ", args);
      if (args.hasOwnProperty("moduleProfile")) {
        console.log("moduleProfile: ", args.moduleProfile);
        setModuleProfile(args.moduleProfile);
      }
      if (args.hasOwnProperty("endpoints")) {
        console.log("Endpoints: ", args.endpoints);
        setEndpoints(args.endpoints);
      }
    })
  }, []);


  const onEndpointUpdate = (endpoint) => {
    setServerEndpoint(endpoint.server);
    setRobotEndPoint(endpoint.robot);
  }

  return (
    <>
    {closing && <OverlayTextComponent />}
    <div className="App">
      <div className="bg-white w-full h-full flex flex-col items-center py-[1rem] px-[8rem]">
        <div className="flex">
          <ConfigSection onEndpointUpdate={onEndpointUpdate} moduleProfile={moduleProfile} endpoints={endpoints}/>
          <div className="flex flex-col gap-[1rem]">
            <CameraSection />
            <RobotSection socket={socket} endpoint={{ server: serverEndpoint, robot: robotEndPoint }} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}



const CameraSection = () => {

  const [log, setLog] = useState('');
  const [camStatus, setCamStatus] = useState({ status: 'Off', color: '#808080' });
  const rebootRef = useRef(false);

  useEffect(() => {

    ipcRenderer.on("cam:alreadyOpen", (event, args) => {
      // args -> true or false
      if (args === true) {
        console.log("cam:alreadyOpen: ", args);
        alert("Camera App is already running. Please exit the app first.");
      }
    });

    ipcRenderer.on("cam:log", (event, args) => {
      console.log("cam:log: ", args);
      setLog((prev) => prev + '\n' + args);
    });

    ipcRenderer.on("cam:status", (event, args) => {
      console.log("cam:status: ", args);

      if (args === 'abnormal termination') { // "#F00"
        setCamStatus({ status: 'Abnormal', color: '#F00' });
        alert("Camera App was abnormal terminated!");
      }
      else if (args === 'terminated') {
        setCamStatus({ status: 'Off', color: '#808080' });
        if (rebootRef.current) {
          console.log('runCamera');
          setTimeout(() => {
            ipcRenderer.send("runCamera", 'spawn');
            rebootRef.current = false;
          }, 1000)
        }
      }
    });


    ipcRenderer.on("cam:err", (event, args) => {
      // console.log("cam:err: ", args);
      // alert('Abnormal termination. Please check the log.');
    });

    ipcRenderer.on("close-default", (event, args) => {
      console.log("close-default, wait...");
      let zedSetting = { targetSetting: 'system', value: 'sys_exit' };
      cameraSocket.emit("zed:command", 'KARI-CAM-0001', zedSetting);
      
      ipcRenderer.send("close-default");
    });


    cameraSocket.on('loading', () => {
      console.log("loading signal received");
      setCamStatus({ status: 'Loading...', color: '#FFFF00' });
    })

    cameraSocket.on('terminating', () => {
      console.log("terminating signal received");
      setCamStatus({ status: 'Terminating...', color: '#FFFF00' });
      cameraSocket.emit("terminate");
    })


    cameraSocket.on('ready', () => {
      console.log("ready signal received");
      // alert("Camera App is ready.");
      setCamStatus({ status: 'Running', color: '#0F0' });
    })


    return () => {

    };

  }, []);


  return (
    <SectionLevel1>
      <div className="flex flex-col items-center w-[52rem]">
        <div className="flex">
          <div className="flex flex-col items-center w-[12rem]">
            <div className="w-full pl-[1rem]">
              <SectionLevel2 title="Camera Status" className="w-[-0.5rem] ml-[1rem]">
              <SectionLevel2 title="" className="w-[0rem] ml-[10rem]" />
              <LedIndicator text={camStatus.status} color={camStatus.color} arg={'w-[9rem]'} />
              </SectionLevel2>
              <SectionLevel2 title="" className="w-[0rem] ml-[10rem]" />

              <SectionLevel2 title="App Control" className="w-[-1rem] ml-[1rem]">
              <CustomButton title="Start" size={'w-[8rem] h-[4.5rem]'} onClick={() => {
                ipcRenderer.send("runCamera", 'spawn');
              }} />
              <SectionLevel2 title="" className="w-[0rem] ml-[10rem]" />
              <CustomButton title="Terminal Start" size={'w-[8rem] h-[4.5rem]'} onClick={() => {
                ipcRenderer.send("runCamera", 'debug');
              }} />

              <SectionLevel2 title="" className="w-[0rem] ml-[10rem]" />
              <CustomButton title="Exit" size={'w-[8rem] h-[4.5rem]'} onClick={() => {
                let zedSetting = { targetSetting: 'system', value: 'sys_exit' };
                cameraSocket.emit("zed:command", 'KARI-CAM-0001', zedSetting);

              }} />
              <SectionLevel2 title="" className="w-[0rem] ml-[10rem]" />
              <CustomButton title="Reboot(fix)" size={'w-[8rem] h-[4.5rem]'} onClick={() => {
                setCamStatus({ status: 'Reboot', color: '#00F' });
                rebootRef.current = true;

                let zedSetting = { targetSetting: 'system', value: 'sys_exit' };
                cameraSocket.emit("zed:command", 'KARI-CAM-0001', zedSetting);
              }} />
              </SectionLevel2>
            </div>
          </div>

          <SectionLevel2 title="Settings & Supported Set" className="w-[40rem] ml-[2rem]">
            <FieldText field="Model" content={"Zed Mini"} />
            <FieldText field="Resolution" content={"1280 x 720"} />
            <FieldText field="Depth Mode" content={"8bit, 12bit (12bit)"} />
            <FieldText field="Visible Distance" content={"0m - 7m (4m)"} />
            <div className="w-full pl-[1rem]">
              <div className="mt-[1rem]">
                <SectionLevel2 title="Camera log" className="w-[40rem] ml-[-1rem]">
                <div id="logArea" className="whitespace-pre-wrap overscroll-y-auto text-left bg-white p-4 rounded shadow-md h-64 overflow-y-auto">
                  {log}
                </div>
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

const OverlayTextComponent = () => {
  const overlayContainerStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    /* Add any additional styling for the container here */
  };

  const overlayTextStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Adjust the background color and opacity as needed
    padding: '10px',
    borderRadius: '5px',
    /* Add any additional styling for the overlay text here */
    color: '#333',
    fontSize: '40px',
    fontWeight: 'bold',
  };

  return (
    <div style={overlayContainerStyle}>
      <div style={overlayTextStyle}>Closing... Please Wait.</div>
      {/* Your other content goes here */}
    </div>
  );
};

export default App;

