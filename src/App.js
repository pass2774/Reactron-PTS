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

  useEffect(() => {
    ipcRenderer.send("app_version");

    ipcRenderer.on("app_version", (event, args) => {
      setVersion(args.version);
      console.log(args.version)
    });

    ipcRenderer.on("hello", (event, args) => {
      console.log("hello request received")
      console.log(args)
    });

    ipcRenderer.on("files", (event, args) => {
      setFiles(args.files);
    });
  }, []);

  const onBtnClick = () => {
    ipcRenderer.send("runExternalProcess");
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <div class="bg-[red] w-[50rem] h-[50rem]"></div>
      <button class="bg-[blue] w-[20rem] h-[10rem] text-3xl text-[white]" onClick={onBtnClick}>Send to Main</button>
    </div>
  );
}

export default App;
