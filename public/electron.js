const { execFile } = require('child_process');
const { spawn, spawnSync } = require('child_process');
const camAppPath = 'C:\\Users\\portal301\\Release\\PORTAL301_ZED_Application.exe';

// var spawn = require('child_process').spawn;

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { SEND_MAIN_PING } = require("constants");
const ExternalProcess = require(path.join(__dirname, "runExternalProcess.js"));


// Use absolute path to your script
const scriptPath = path.join(__dirname, 'child_script.js');
const npmPath = path.join(__dirname, 'node_modules', '.bin', 'npm');

const fs =require('fs');

let mainWindow;
let moduleProfile;
let isCamAppOpen = false;
let child = null;


function runCameraWithShell(event) {

  const childProcess = execFile(camAppPath, [], (error, stdout, stderr) => {
    //const child = execFile('C:\\workspace\\portal301\\C++\\zedApp\\build\\Release\\KARI_CAM_APP.exe', [], (error, stdout, stderr) => {
      if (error) {
        console.log(stderr);
        throw error;
      }
      let exitCode = childProcess.exitCode;
      console.log('child process terminated with code '+exitCode);

      if (exitCode !== 0) {
        event.reply("cam:err", 'child process terminated with code '+exitCode);
      }
      else {
        event.reply("cam:status", 'terminated');  
      }
    });
  
}

function runCamera(event) {
  //var child = spawn('C:\\workspace\\test.bat', [], {shell: true});
  child = spawn(camAppPath, [], {shell: true});

  child.stdout.on('data', function(data) {
    // isCamAppOpen = false;
    console.log(data.toString());
    event.reply("cam:log", data.toString());
    
  });
  
  child.on('close', function(code, signal) {
    //console.log('child process terminated due to receipt of signal '+signal);
    console.log('child process terminated with code '+code);

    if(code !== 0){
      //event.reply("cam:err", 'child process terminated with code '+code);
      event.reply("cam:status", 'abnormal termination');
    } else {
      event.reply("cam:status", 'terminated');
    }
    
    isCamAppOpen = false;
    child = null;
  });

}


function createWindow() {
  let server = require('./socketServer');
  let camServer = require('./socketServer/socketServer');

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
  mainWindow.on("closed", () => {
    mainWindow = null
    if (child) {
      console.log('child process terminated due to receipt of signal SIGTERM');
      child.kill('SIGTERM');
    }
  });
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


ipcMain.on("runCamera", (event, args) => {
  if (isCamAppOpen === false) {
    isCamAppOpen = true;
    runCamera(event);
    
  }
  else {
    event.reply("cam:alreadyOpen", true);
  }
  
});


ipcMain.on("cam:test", (event, args) => {
  console.log("cam:test received");
  if(child) {
    // console.log("cam:test child exists");
    // //child.stdin.resume();
    // //child.stdin.setDefaultEncoding('utf-8');
    // // child.stdin.write('q');
    // child.stdin.write('q\n');
    // child.stdin.write('q');
    // child.stdin.write('q\r\n');
    // child.stdin.write(String.fromCharCode(113));
    // // child.stdin.end();
  }
  
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
  console.log("window-all-closed@@@@")
  if (process.platform !== "darwin") {
    app.quit();
  }
});


app.on('before-quit', () => { 
  console.log('before-quit');
});

app.on('quit', () => { 
  console.log('quit!!!');
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