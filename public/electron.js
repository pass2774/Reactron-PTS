const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { SEND_MAIN_PING } = require("constants");
const ExternalProcess = require(path.join(__dirname, "runExternalProcess.js"));


let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
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
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.setResizable(true);
  mainWindow.on("closed", () => (mainWindow = null));
  mainWindow.focus();
  ExternalProcess.runHelloWorldProcess();
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
  
ipcMain.on("hello", event => {
console.log("hello request received")
// event.reply("hello", { version: app.getVersion() });
});  

ipcMain.on("runExternalProcess", event => {
    console.log("runExternalProcess request received")
    // event.reply("runExternalProcess", { version: app.getVersion() });
    // ExternalProcess.runHelloWorldProcess();
      ExternalProcess.runHelloWorldProcessSync();
    
});




app.on("ready", createWindow);

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