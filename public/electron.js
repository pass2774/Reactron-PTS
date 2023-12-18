
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { SEND_MAIN_PING } = require("constants");
const ExternalProcess = require(path.join(__dirname, "runExternalProcess.js"));


// Use absolute path to your script
const scriptPath = path.join(__dirname, 'child_script.js');
const npmPath = path.join(__dirname, 'node_modules', '.bin', 'npm');


const path_moduleProfile = "./src/config/moduleProfile.json";
const path_endpoints = "./src/config/endpoints.json";
let moduleProfile;
let endpoints;

const fs = require('fs');
const { cat } = require('shelljs');

let mainWindow;
// let endpoints;
function createWindow() {
  let server = require('./socketServer'); // robot control server 
  let camServer = require('./socketServer/socketServer'); // camera app control server

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
      if (ExternalProcess?.cameraProcessisRunning()) {
        if (countTryClose === 5) {
          clearInterval(interval);
          mainWindowDestroy();
        }
        if (mainWindow) mainWindow.webContents.send('close-default');
        countTryClose++;

      } else {
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
    if (args.moduleProfile.header === "get") {
      fs.readFile(path_moduleProfile, 'utf-8', (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return;
        }
        moduleProfile = JSON.parse(data);
        response.moduleProfile = moduleProfile;
        event.reply("robot-dashboard", response);
      });
    } else if (args.moduleProfile.header === "set") { // not tested - joonhwa choi 2023-12-18
      moduleProfile = args.moduleProfile.body;
      const modifiedJsonString = JSON.stringify(moduleProfile, null, 2);
      // Write the modified data back to the file
      fs.writeFile(path_moduleProfile, modifiedJsonString, 'utf-8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
        } else {
          console.log('File successfully modified.');
        }
        response.moduleProfile = moduleProfile;
        event.reply("robot-dashboard", response);
      });
    }
  }
  if (args.hasOwnProperty("endpoints")) {
    if (args.endpoints.header === "get") {
      // Read the JSON file
      fs.readFile(path_endpoints, 'utf-8', (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return;
        }
        // Parse JSON data
        endpoints = JSON.parse(data);
        response.endpoints = endpoints;
        event.reply("robot-dashboard", response);
      });
    } else if (args.endpoints.header === "set") {
      endpoints = args.endpoints.body;
      const modifiedJsonString = JSON.stringify(endpoints, null, 2);
      // Write the modified data back to the file
      fs.writeFile(path_endpoints, modifiedJsonString, 'utf-8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
        } else {
          console.log('File successfully modified.');
        }
        response.endpoints = endpoints;
        event.reply("robot-dashboard", response);
      });
    }

  }

  event.reply("robot-dashboard", response);
  console.log("respose sent: ", response);

  event.reply("runExternalProcess", { version: app.getVersion() });
});


ipcMain.on("runCamera", (event, args) => {
  console.log("runCamera received", args)

  const status = ExternalProcess.runCameraProcess(event, args);
  
  if (!status) event.reply("cam:alreadyOpen", true);

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
  fs.readFile(path_moduleProfile, 'utf-8', (err, data) => {
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
    fs.writeFile(path_moduleProfile, modifiedJsonString, 'utf-8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('File successfully modified.');
      }
    });
  });


}

openAndModifyJSONFile();