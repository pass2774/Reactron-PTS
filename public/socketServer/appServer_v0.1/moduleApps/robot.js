'use strict'

const TAG = "[PortalComm_v0.1:robot handler]"

const registerRobotHandler = (io, socket) => {
  socket.on("robot", (type,packet)=>{
    console.log("message:",packet);
    if(typeof(packet) != 'object') {
        try{
            packet = JSON.parse(packet); //this msg from c++ app (zed App)
        }catch(error){
            console.log("Error parsing JSON:", error);
            return;
        }
    }
    console.log("message handlers");
    if(type === "C2C"){ //client-to-client messaging
      msgC2CHandler(type, packet);
        // callback(msgV0handler(packet));
    }
  });

  function msgC2CHandler(type, packet){
    console.log(TAG,'msg-c2c:',type, packet);
    try{
        if(!packet.hasOwnProperty("msg")){
          const err = {tag:TAG, status:"reject", msg:"packet.msg === null"}
          return err;
        }

        if(!packet.hasOwnProperty("to")){
          const err = {tag:TAG, status:"reject", msg:"packet.to === null"}
          console.log(err);
          return err;
        }else{
          if(!packet.hasOwnProperty("from")){
              packet.from = null;
          }
          socket.broadcast.to(packet.to).emit("robot", type, packet);
        }
    }catch(e){
        const err = {tag:TAG, status:"reject", msg:"unknown error"}
        console.error(e);
        return err;
    }
    return {tag:TAG,status:"success",msg:"message-c2c handler done"};
  }
}


function checkJSON_and_convert(maybeJSON){    //for the communication with python socketIO client
  if (typeof maybeJSON !== 'object'){
      console.log(TAG,"recieved packet is not a object type. convert it to JSON.")
      try{
          maybeJSON = JSON.parse(maybeJSON); //this msg from c++ app (zed App)
      }catch(error){
          console.log("Error parsing JSON:", error);
          return -1;
      }
  }
  return maybeJSON;
} 
  
module.exports = registerRobotHandler;