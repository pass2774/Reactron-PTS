'use strict'

const TAG = "[portalComm_v0.1]";
const registerRobotHandler = require("./moduleApps/robot.js");
const registerWebRTCHandler = require("./moduleApps/webrtc.js");

let nsp = "/";
const typeExpected = ["camera", "robot"]; // edit "webrtc" to "camera" by Joonik

const modulePortal = (io, socket) => {

  let profile = {};

  socket.conn.on("close", () => {
 
    console.log('socket.conn.con("close") is called');
    console.log('closing profile', profile);

  });

  async function onUpdateModulePortal(msg, callback) {
    msg = checkJSON_and_convert(msg);

    console.log('profile update msg>>', msg);

    if (!msg.hasOwnProperty("request")) {
      callback({ tag: TAG, status: "fail", msg: "request type not defined" });
      return;
    }
    if (!msg.hasOwnProperty("profile")) {
      callback({ tag: TAG, status: "fail", msg: "profile not defined" });
      return;
    }
    
    profile = checkJSON_and_convert(msg.profile);


    // curl -k -X POST -H "Content-Type: application/json" -d '{"profile":{"serialNumber": "SN000-FAKE-0000","type":"fake"}}' https://localhost:3333/fetch/v0.1/module/module-preregister

    if (msg.request === "register") {
      if (typeExpected.indexOf(profile.type) !== -1) {//check if the profile type is in the list
        if (profile.type === "webrtc") {
          registerWebRTCHandler(io, socket);
        } else if (profile.type === "robot") {
          registerRobotHandler(io, socket); // --> callback(return of handler for code-regularity)
        } 
      } else { // invaild type
        callback({ tag: TAG, status: "fail", msg: "invalid module type -> choose among'webrtc','robot','sensor' " });
        return;
      }

      socket.join(profile.serialNumber);

      callback({ status: "ok", registeredModule: { serialNumber: profile.id, moduleType: profile.type, role: "HOST" } });

    } 
  }

  //not tested
  async function onRequestConnetion(packet, callback) {

    packet = checkJSON_and_convert(packet);
    console.log("onRequestConnection:", packet);
    
    if (!packet.hasOwnProperty("serialNumber")) {
      callback({ tag: TAG, status: "fail", msg: "no target module designated22" });
      return;
    }

    let target_module = packet;
    
    if (target_module === undefined || target_module === null) {
      callback({ tag: TAG, status: "fail", msg: "no matching module found" });
      return;
    }

    console.log('connecting to module >>', target_module);

    let clientsInRoom = io.of(nsp).adapter.rooms[target_module.serialNumber];
    let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log(TAG, '(before entry) module(room) [' + target_module.serialNumber + '] now has ' + numClients + ' client(s)');

    if (numClients <= 30) {
      console.log(TAG, 'Client [' + socket.id + '] joined room [' + target_module.serialNumber + ']');
      // io.sockets.in(packet.serialNumber).emit('join', packet.serialNumber);
      socket.join(target_module.serialNumber);
    } else { // max clients
      callback({ tag: TAG, status: "fail", msg: "max client - full room" });
      return;
    }

    if (typeExpected.indexOf(target_module.type) !== -1) {//check if the profile type is in the list
      if (target_module.type === "camera") { // edit "webrtc" to "camera" by Joonik
        registerWebRTCHandler(io, socket);
      } else if (target_module.type === "robot") {
        console.log("type of target module:", target_module.type)
        registerRobotHandler(io, socket);
      } else if (target_module.type === "sensor") {
        //register some handler
      }
    } else { // invaild type
      callback({ tag: TAG, status: "fail", msg: "invalid module type -> choose among 'webrtc','robot','sensor' " });
      return;
    }

    callback({ tag: TAG, status: "ok", msg: "joined in module room" });
    return;
  }


  socket.on("update-module-portal", onUpdateModulePortal);
  // socket.on("query-module-portal", onQueryModulePortal);
  socket.on("connect-module", onRequestConnetion);
  // socket.on("disconnect-module", onRequestDisconnetion);
  socket.on("disconnect", (reason) => {

  });

}




function checkJSON_and_convert(maybeJSON) {    //for the communication with python socketIO client
  if (typeof maybeJSON !== 'object') {
    console.log(TAG, "recieved packet is not a object type. convert it to JSON.")
    try {
      maybeJSON = JSON.parse(maybeJSON); //this msg from c++ app (zed App)
    } catch (error) {
      console.log("Error parsing JSON:", error);
      return -1;
    }
  }
  return maybeJSON;
}

module.exports = { 
  modulePortal, 
};