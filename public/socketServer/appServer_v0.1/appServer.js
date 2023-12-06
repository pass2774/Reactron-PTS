"use strict";

const { Server } = require("socket.io");
const { modulePortal } = require("./modulePortal.js");
const { v4: uuidv4 } = require("uuid");

const TAG = "[portalComm_v0.1]" //for console.log

// PORTALCOMM_VER: flag for the isolated process between each version of portalComm 
const PORTALCOMM_VER = "portalComm_v0.1";
let io = null;
function createSocketApp(server){
  io = new Server(server,{path:`/${PORTALCOMM_VER}`});
  io.on("connection", (socket) => {
    console.log(TAG,"socket initiated", socket.id);
    console.log(TAG,"current process is " + process.pid);
    socket.emit("guide-socketid", socket.id); //guide socket id to cpp socketIO
    
    socket.data.moduleId = "module:" + socket.id;
    socket.registeredListener = [];
    socket.data.id = uuidv4();
    // socket.join(socket.id);
    //socket.emit("your id", socket.data.id);
    socket.emit("your id", socket.id);
    socket.emit("guide-socketid", socket.id); //guide socket id to cpp socketIO

    socket.join(socket.id);

    modulePortal(io, socket);
    // broadcastModuleList(io, modules);


    socket.on("echo", (msg1, msg2, msg3)=>{
      console.log(TAG, "check echo msg:", msg1, msg2, msg3);
    });

    const zedCommander = (serialNumber, command) => {
  
      console.log('[zed:command] serialNumber :', serialNumber);
      socket.broadcast.to(serialNumber).emit('zed:command', command);
  
    };
    
    socket.on("zed:command", zedCommander);
    socket.on("loading", () => {
      console.log(TAG, "loading");
      io.emit("loading");
    })
    socket.on("ready", () => {
      console.log(TAG, "ready");
      io.emit("ready");
    })
    socket.on("terminating", () => {
      console.log(TAG, "terminating");
      io.emit("terminating");
    })
    socket.on("terminate", () => {
      console.log(TAG, "terminate");
      io.emit("terminate");
    })
    
    

    socket.on("PONG", (msg)=>{
      console.log(TAG,"pong from sid:"+socket.id+"  msg:"+msg);
    });
  
    socket.on('bye', function(){
      console.log(TAG,'received bye');
    });

    socket.on("disconnect", (reason) => {
      console.log('[Disconnect client]', socket.id , ':', reason);
      if (reason === 'transport close') {
        
      }
    });
  });

}

function closeSocketApp(){
  if (!io) return;
  console.log(TAG,"close socket app")
  io.disconnectSockets();
  io.close();
}


function checkJSON_and_convert(maybeJSON){    //for the communication with python socketIO client
  if (typeof maybeJSON !== 'object'){
    console.log(TAG,"recieved packet is not a object type. convert it to JSON.")
    maybeJSON = JSON.parse(maybeJSON);
  }
  return maybeJSON;
} 


exports.createSocketApp = createSocketApp;
exports.closeSocketApp = closeSocketApp;
