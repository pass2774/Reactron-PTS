const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { SEND_MAIN_PING } = require("constants");
const ExternalProcess = require(path.join(__dirname, "runExternalProcess.js"));

// Use absolute path to your script
const scriptPath = path.join(__dirname, 'child_script.js');
const npmPath = path.join(__dirname, 'node_modules', '.bin', 'npm');

const fs =require('fs');
const {spawn, spawnSync} = require('child_process');

let mainWindow;

let moduleProfile;

function createWindow() {
  // let server = require('./socketServer');
  let server2 = require('./socketServer/socketServer');

  mainWindow = new BrowserWindow({
    width: 1640,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      devTools: isDev,
      preload: path.join(__dirname, "preload.js")
    },
  });

  // mainWindow.loadURL(
  //   url.format({
  //     pathname: path.join(__dirname, 'build', 'index.html'),
  //     protocol: 'file:',
  //     slashes: true,
  //   })
  // );
  
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "attach" });
  }

  mainWindow.setResizable(true);
  mainWindow.on("closed", () => (mainWindow = null));
  mainWindow.focus();
  // ExternalProcess.runHelloWorldProcess();
//   ExternalProcess.runHelloWorldProcessSync();


  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('hello',"data");
    console.log("hello sent");
  });

}

ipcMain.on(SEND_MAIN_PING, (event, arg) => {
    console.log("Main.js received a ping!!!")
})

ipcMain.on("app_version", event => {
    console.log("app_version request received")
    event.reply("app_version", { version: app.getVersion() });
  });
  
ipcMain.on("runExternalProcess", event => {
    console.log("runExternalProcess request received")
    // event.reply("runExternalProcess", { version: app.getVersion() });
    // ExternalProcess.runHelloWorldProcess();
      ExternalProcess.runHelloWorldProcessSync();
    
});

ipcMain.on("robot-dashboard-request", (event, args) => {
    console.log("robot-dashboard-request received");
    console.log("args: ",args);
    let response = {};
    if(args.hasOwnProperty("connect")){
      if (args.connect){
        ExternalProcess.runRobotProcess(args.endpoint);
        response.robotControlMode = "remote";
      } else {
        response.robotControlMode = "Not Available";
      }
    }
    if(args.hasOwnProperty("moduleProfile")){
      response.moduleProfile = moduleProfile;
    }

    event.reply("robot-dashboard", response);
    console.log("respose sent: ",response);

    event.reply("runExternalProcess", { version: app.getVersion() });
});




app.on("ready", ()=>{

  createWindow();
});

// SSL/TSL: this is the self signed certificate support
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // On certificate error we disable default behaviour (stop loading the page)
  // and we then say "it is all fine - true" to the callback
  event.preventDefault();
  callback(true);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Function to open and modify a JSON file
function openAndModifyJSONFile() {
  // Read the JSON file
  const filePath = "./src/config/moduleProfile.json";
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    // Parse JSON data
    moduleProfile = JSON.parse(data);
    console.log("moduleProfile: ",moduleProfile);
    // Modify the JSON data (replace this with your modification logic)
    // moduleProfile.robot.connectivity.endpoint = {server:"portal301", robot:"192.168.0.3"};
    // moduleProfile.camera.connectivity.endpoint = "http://localhost:xxxx";

    // Convert the modified data back to JSON string
    const modifiedJsonString = JSON.stringify(moduleProfile, null, 2);

    // Write the modified data back to the file
    fs.writeFile(filePath, modifiedJsonString, 'utf-8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('File successfully modified.');
      }
    });
  });
}

openAndModifyJSONFile();