const { execFile, exec } = require('child_process');
const { spawn, spawnSync } = require('child_process');
//const camAppPath = 'C:\\Users\\portal301\\Release\\PORTAL301_ZED_Application.exe';
const camAppPath = 'C:\\workspace\\portal301\\C++\\zedApp\\build\\Release\\PORTAL301_ZED_Application.exe';
const TerminalAppPath = 'C:\\workspace\\portal301\\C++\\zedApp\\build\\Release\\batStart.bat';

// var spawn = require('child_process').spawn;

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { SEND_MAIN_PING } = require("constants");
const ExternalProcess = require(path.join(__dirname, "runExternalProcess.js"));


// Use absolute path to your script
const scriptPath = path.join(__dirname, 'child_script.js');
const npmPath = path.join(__dirname, 'node_modules', '.bin', 'npm');

const fs = require('fs');
const { cat } = require('shelljs');

let mainWindow;
let moduleProfile;
let isCamAppOpen = false;
let CameraProcess = null;


function runCameraWithShell(event) {

  if (CameraProcess) return;

  CameraProcess = execFile(TerminalAppPath, [], (error, stdout, stderr) => {
    //const child = execFile('C:\\workspace\\portal301\\C++\\zedApp\\build\\Release\\KARI_CAM_APP.exe', [], (error, stdout, stderr) => {
    if (error) {
      console.log(stderr);
      isCamAppOpen = false;
      CameraProcess = null;
      throw error;
    }
    event.reply("cam:log", stdout);
    let exitCode = CameraProcess.exitCode;
    console.log('child process terminated with code ' + exitCode);

    if (exitCode !== 0) {
      event.reply("cam:err", 'child process terminated with code ' + exitCode);
    }
    else {
      event.reply("cam:status", 'terminated');
    }

    isCamAppOpen = false;
    CameraProcess = null;

  });

}

function runCamera(event) {
  //var child = spawn('C:\\workspace\\test.bat', [], {shell: true});
  CameraProcess = spawn(camAppPath, [], { shell: true });

  CameraProcess.stdout.on('data', function (data) {
    // isCamAppOpen = false;
    console.log(data.toString());
    event.reply("cam:log", data.toString());

  });

  CameraProcess.on('close', function (code, signal) {
    //console.log('child process terminated due to receipt of signal '+signal);
    console.log('child process terminated with code ' + code);

    if (code !== 0) {
      //event.reply("cam:err", 'child process terminated with code '+code);
      event.reply("cam:status", 'abnormal termination');
    } else {
      event.reply("cam:status", 'terminated');
    }

    isCamAppOpen = false;
    CameraProcess = null;
    // console.log('app quit!!');
    // app.quit();
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
  // mainWindow.on("closed", () => {
  //   mainWindow = null
  // });

  mainWindow.on('close', async e => {
    e.preventDefault()
    // camServer.endServer();
    mainWindow.webContents.send('close-default');
  })

  mainWindow.focus();
  // ExternalProcess.runHelloWorldProcess();
  //   ExternalProcess.runHelloWorldProcessSync();


  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('hello', "data");
    console.log("hello sent");
  });

}

ipcMain.on("close-default", event => {

  try {
    let countTryClose = 0;
    console.log("close-default received");
    const interval = setInterval(() => {
      console.log("close-default setInterval");
      if (CameraProcess) {
        if (countTryClose === 5) {
          clearInterval(interval);
          mainWindowDestroy();
        }
        if (mainWindow) mainWindow.webContents.send('close-default');
        countTryClose++;

      } else {
        interval.unref();
        clearInterval(interval);
        mainWindowDestroy();
      }
    }, 500);

  } catch (error) {
    console.log("close-default error: ", error);
    mainWindowDestroy();
  }

});

function mainWindowDestroy() { 
  if (mainWindow) {
    mainWindow.destroy();
    mainWindow = null;
  }
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
  console.log("args: ", args);
  let response = {};
  if (args.hasOwnProperty("connect")) {
    if (args.connect) {
      ExternalProcess.runRobotProcess(args.endpoint);
      response.robotControlMode = "remote";
    } else {
      response.robotControlMode = "Not Available";
    }
  }
  if (args.hasOwnProperty("moduleProfile")) {
    response.moduleProfile = moduleProfile;
  }

  event.reply("robot-dashboard", response);
  console.log("respose sent: ", response);

  event.reply("runExternalProcess", { version: app.getVersion() });
});


ipcMain.on("runCamera", (event, args) => {
  console.log("runCamera received", args)
  if (isCamAppOpen === false) {
    isCamAppOpen = true;
    if (args === 'debug') {
      runCameraWithShell(event);
    } else {
      runCamera(event);
    }

  }
  else {
    event.reply("cam:alreadyOpen", true);
  }

});


ipcMain.on("cam:test", (event, args) => {
  console.log("cam:test received");
  if (CameraProcess) {
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



app.on("ready", () => {

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
  console.log("window-all-closed event")
  if (process.platform !== "darwin") {
    if (CameraProcess) {
      console.log("child exists, pid: ", CameraProcess.pid);
    }
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
    console.log("moduleProfile: ", moduleProfile);
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