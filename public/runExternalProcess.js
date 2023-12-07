const {spawn, spawnSync,exec, execFile} = require('child_process');
const {ipcRenderer, powerMonitor} = require('electron');

const path = require("path");
const ExternalProcess = require(path.join(__dirname, "runExternalProcess.js"));

const fs = require('fs');
const { connect } = require('http2');
const { disconnect } = require('process');
const { start } = require('repl');

const out = fs.openSync('./out.log', 'w');
const err = fs.openSync('./out.log', 'w');
let StringDecoder=require('string_decoder').StringDecoder;
let decoder = new StringDecoder('utf8');

function runHelloWorldProcessSync() {
  console.log('Running helloworld.exe...');

  const result = spawnSync(path.join(__dirname, "helloworld.exe"), { stdio: 'inherit' });

  if (result.error) {
    console.error('Error running helloworld.exe:', result.error);
  //   process.exit(1);
  }

  console.log('helloworld.exe completed successfully.');
}

function runUtility() {
  console.log('Running helloworld.exe...');

  const result = spawnSync(path.join(__dirname, "helloworld.exe"), { stdio: 'inherit' });

  if (result.error) {
    console.error('Error running helloworld.exe:', result.error);
  //   process.exit(1);
  }

  console.log('helloworld.exe completed successfully.');
}

// function runHelloWorldProcess() {
//     console.log('Running helloworld.exe...(without sync)');
  

//     const subprocess = spawn(path.join(__dirname, "helloworld.exe"),[],{
//       shell: true,
//       // detached: true,
//       stdio: ['pipe', 'pipe', 'pipe']
//     });
//     subprocess.unref();
//     subprocess.stdout.setEncoding('utf8');
//     subprocess.stderr.setEncoding('utf8');
  
//     subprocess.stdout.on('data', (data) => {
//       console.log(`stdout: ${data}`);
//     });
  
//     subprocess.stderr.on('data', (data) => {
//       console.error(`stderr: ${data}`);
//     });
//     console.log('spawned helloworld.exe...');
    
//     subprocess.on('close', (code) => {
//       console.log(`helloworld.exe completed with code ${code}`);
  
//     });
//   }
/*
electron -> robot:
connect/disconnect
power-on/power-off
program-start/program-stop


1. program start & connect to system
2. robot power on
3. robot program start //여기까진 ok

4. robot program stop //여기서부터 문제
5. robot power off  
6. robot disconnect


robot -> electron:
robot-status
robot-program-status  (running/stopped)
robot-control-mode (remote/local)
robot-operation-status (0-5)
robot-error-code (0-255)
robot-error-message (string)
*/


  function runHelloWorldProcess() {
    console.log('Running helloworld.exe...(without sync)');
  

    const subprocess = spawn(path.join(__dirname, "helloworld.exe"),[],{
      shell: true,
      // detached: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    subprocess.unref();
    subprocess.stdout.setEncoding('utf8');
    subprocess.stderr.setEncoding('utf8');
  
    subprocess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
  
    subprocess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    console.log('spawned helloworld.exe...');
    
    subprocess.on('close', (code) => {
      console.log(`helloworld.exe completed with code ${code}`);
  
    });
  }

  function runRobotProcess(endpoint) {
    console.log('endpoint.robot: ',endpoint.robot);
    console.log('endpoint.network: ',endpoint.network);
    const args = ['-r',endpoint.robot, '-s',endpoint.network];
    console.log('args=',args);
    const subprocess = spawn(path.join(__dirname, "remoteRobot.exe"),args,{
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    subprocess.unref();
    subprocess.stdout.setEncoding('utf8');
    subprocess.stderr.setEncoding('utf8');
  
    subprocess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    subprocess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    console.log('Spawned remoteRobot.exe... as a child process of electron');
    
    subprocess.on('close', (code) => {
      console.log(`remoteRobot.exe completed with code ${code}`);
    });
  }



  const camAppPath = 'C:\\workspace\\portal301\\C++\\zedApp\\build\\Release\\PORTAL301_ZED_Application.exe';
  const TerminalAppPath = 'C:\\workspace\\portal301\\C++\\zedApp\\build\\Release\\batStart.bat';
  let CameraProcess = null;
  
  function runCameraProcessWithShell(event) {
  
    CameraProcess = execFile(TerminalAppPath, [], (error, stdout, stderr) => {
      //const child = execFile('C:\\workspace\\portal301\\C++\\zedApp\\build\\Release\\KARI_CAM_APP.exe', [], (error, stdout, stderr) => {
      if (error) {
        console.log(stderr);
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
  
      CameraProcess = null;
  
    });

    return true;
  
  }
  
  function runCameraProcess(event, args) {

    if (CameraProcess) return false;

    if (args === 'debug') {
      return runCameraProcessWithShell(event);
    }

    CameraProcess = spawn(camAppPath, [], { shell: true });
  
    CameraProcess.stdout.on('data', function (data) {
      console.log(data.toString());
      event.reply("cam:log", data.toString());
  
    });
  
    CameraProcess.on('close', function (code, signal) {
      console.log('child process terminated with code ' + code);
  
      if (code !== 0) {
        //event.reply("cam:err", 'child process terminated with code '+code);
        event.reply("cam:status", 'abnormal termination');
      } else {
        event.reply("cam:status", 'terminated');
      }
  
      CameraProcess = null;
    });

    return true;
  
  }

  function cameraProcessisRunning() {
    return CameraProcess !== null;
  }

  // export default runHelloWorldProcess;
  module.exports={
    runRobotProcess,
    runCameraProcess,
    cameraProcessisRunning,
    runHelloWorldProcess,
    runHelloWorldProcessSync
  }
