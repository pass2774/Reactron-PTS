'use strict'

const { entries } = require("lodash");
const e = require("cors");

const TAG = "[portalComm_v0.1]"
const registerRobotHandler = require("./moduleApps/robot.js")
const registerWebRTCHandler = require("./moduleApps/webrtc.js");
// const ptl_module = require("../models/ptl_module.js");


let nsp = "/";
const typeExpected = ["camera", "robot", "sensor"]; // edit "webrtc" to "camera" by Joonik
// const axios =require("axios");
/*
  TODO:
    DB 연동
    각 메세지에대한 sender의 권한?
    "GET": filtering function
    "GET": myserialNumber?
    ""
*/


const modulePortal = (io, socket) => {

  let profile = {};

  socket.conn.on("close", () => {
    // socket.on("disconnect")가 아니라 socket.conn.on("close")를 써야할듯
    // why?
    console.log('socket.conn.con("close") is called');
    console.log('closing profile', profile);

  });

  async function onUpdateModulePortal(msg, callback) {
    msg = checkJSON_and_convert(msg);

    // let socketId = socket.id;
    // let socketList = await io.of(nsp).in(socketId).fetchSockets();
    // console.log("socketList:",socketList);

    console.log('profile update msg>>', msg);

    // module type을 지정해서 분기해야됨. 물론 지금은 서비스가 webrtc밖에 없으니 ...
    if (!msg.hasOwnProperty("request")) {
      callback({ tag: TAG, status: "fail", msg: "request type not defined" });
      return;
    }
    if (!msg.hasOwnProperty("profile")) {
      callback({ tag: TAG, status: "fail", msg: "profile not defined" });
      return;
    }
    // let profile = msg.profile;
    profile = checkJSON_and_convert(msg.profile);


    // curl -k -X POST -H "Content-Type: application/json" -d '{"profile":{"serialNumber": "SN000-FAKE-0000","type":"fake"}}' https://localhost:3333/fetch/v0.1/module/module-preregister

    if (msg.request === "register") {
      // ptl_module.register(profile).then((res) => { console.log(res); }).catch((err) => { console.log(err); });
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

      // ptl_module.search({}).then((res) => {
      //   console.log(res);
      //   broadcastModuleList(io, res);
      // })
      // .catch((err) => { console.log(err); });

      callback({ status: "ok", registeredModule: { serialNumber: profile.id, moduleType: profile.type, role: "HOST" } });

    } 
  }


  //not tested
  async function onRequestConnetion(packet, callback) {

    packet = checkJSON_and_convert(packet);
    console.log("onRequestConnection:", packet);

    if (!packet.hasOwnProperty("serialNumber")) {
      callback({ tag: TAG, status: "fail", msg: "no target module designated" });
      return;
    }

    if (packet.hasOwnProperty("isCaster"))
    {
      console.log('isCaster is defined, it is Caster');
      if (packet.isCaster === true || packet.isCaster === false) {
        socket.data.isCaster = packet.isCaster;
      } else {
        callback({ tag: TAG, status: "fail", msg: "module profile property (isCaster) value is Invalid" });
      }
    } 
    else 
    {
      console.log('isCaster is not defined');
      socket.data.isCaster = false;
    }


    let target_module = packet    
    
    // let target_module = await ptl_module.myFind({ serialNumber: packet.serialNumber });

    // let target_module = await ptl_module.search({ serialNumber: packet.serialNumber }).then((res) => {
    //   console.log('target_module', res);
    //   broadcastModuleList(io, res);
    // })
    //   .catch((err) => { console.log('target_module', err); });

    if (target_module === undefined || target_module === null) {
      // if (target_module === undefined) {
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

        if (socket.registeredListener.includes('webrtc'))
        {
          console.log("webrtc lienter already registered")
        }
        else {
          socket.registeredListener.push('webrtc')
          registerWebRTCHandler(io, socket);
        }

      } else if (target_module.type === "robot") {

        if (socket.registeredListener.includes('robot'))
        {
          console.log("robot lienter already registered")
        }
        else {
          console.log("type of target module:", target_module.type)
          socket.registeredListener.push('robot')
          registerRobotHandler(io, socket);
        }        

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

  function onRequestDisconnetion(msg, callback) {
    // if(user_participation.filter(id=> id === profile.id)){
    //   console.log("deleting module id=", profile.id ,"  from user-participation");
    //   user_participation = user_participation.filter(id => id !== profile.id);
    // }else{
    //   console.log("no matching module.id found from user-participation");
    // }
  }

  socket.on("update-module-portal", onUpdateModulePortal);
  socket.on("connect-module", onRequestConnetion);
  socket.on("disconnect-module", onRequestDisconnetion);
  socket.on("disconnect", (reason) => {

  });

}

function broadcastModuleList(io, modules) {
  console.log('------broadcasting module list-------')
  console.log(modules);
  console.log('-------------------------------------')
  io.sockets.emit('modules:updated', modules);
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

module.exports = { modulePortal, broadcastModuleList };