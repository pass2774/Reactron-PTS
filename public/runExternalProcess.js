const {spawn, spawnSync,exec, execFile} = require('child_process');
const {ipcRenderer} = require('electron');

const path = require("path");
const ExternalProcess = require(path.join(__dirname, "runExternalProcess.js"));

const fs = require('fs');

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
  // export default runHelloWorldProcess;
  module.exports={
    runHelloWorldProcess,
    runHelloWorldProcessSync
  }
