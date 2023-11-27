"use strict"

module.exports = (io, socket) => {

  const onConnectionRequest = async (packet) => {

    // packet = checkJSON_and_convert(packet);
    let serialNumber = packet.serialNumber;
    let viewerID = packet.viewerID;

    const sockets = await io.in(serialNumber).fetchSockets();
    console.log('sockets', sockets.id);
    sockets.forEach(socket => {
      // console.log('socket id', socket.id);
      if (socket.data.isCaster) {
        console.log(`
                [ WebRTC Connection Request Message ( Join to ${serialNumber} ) ]
                Serial Number: ${serialNumber || 'N/A'}
                viewer ID: ${viewerID || 'N/A'}
                ////WebRTC Connection Request Message END////
                `
        );
        socket.emit('webrtc:connection request', packet); // viewer to caster
        console.log('socket id', socket.id, socket.data.isCaster);
        // socket.broadcast.to(socket.id).emit('webrtc:connection request', packet);
      }
      
    });
  };


  const onSignaling = async (packet) => {

    // console.log('onSignaling-test ex:',packet);
    packet = checkJSON_and_convert(packet);
    // console.log('onSignaling-test after:',packet);
    let serialNumber = packet.serialNumber;
    let viewerID = packet.viewerID;
    let description = packet.description;
    let candidate = packet.candidate;

    if (viewerID === 'undefined') viewerID = undefined; // for c++ app
    if (description === 'undefined') description = undefined; // for c++ app
    if (candidate === 'undefined') candidate = undefined; // for c++ app
    if (typeof (description) === 'string') description = JSON.parse(description); // for c++ app
    if (typeof (candidate) === 'string') candidate = JSON.parse(candidate); // for c++ app

    // io.on("connection",socket => { socket.data.serialNumber = asdf})
    // io.in(SerialNumber).fetchSocket().foreach(this.data.serialNumber === targetSerialNumber )

    const sendingPacket = {
      viewerID: viewerID,
      description: description,
      candidate: candidate,
    }

    if (socket.data.isCaster) {

      console.log(`
      [ Signal Message ( Caster -----> Viewer ) ]
      Serial Number: ${serialNumber || 'N/A'}
      viewer ID: ${viewerID || 'N/A'}
      Description Type: ${description?.type || 'N/A'}
      Candidate: ${candidate || 'N/A'}
      ////Signal Message END////`);
      // console.log('socket id', socket.id, socket.data.isCaster);
      // const sockets = await io.in(viewerID).fetchSockets();
      // sockets.forEach(element => {
      //   console.log('element.id',element.id, element.id === viewerID);
      //   if (element.id === viewerID)
      //   {
      //     element.emit('hello', sendingPacket);
      //   }
      //   // if (element.id === viewerID) {
      //   // }
      // });
      socket.broadcast.to(viewerID).emit('webrtc:signaling', sendingPacket) // caster to viewer

    } else {

      const sockets = await io.in(serialNumber).fetchSockets();
      sockets.forEach(socket => {
        if (socket.data.isCaster) {
          console.log(`
          [ Signal Message ( Viewer -----> Caster ) ]
          Serial Number: ${serialNumber || 'N/A'}
          viewer ID: ${viewerID || 'N/A'}
          Description Type: ${description?.type || 'N/A'}
          Candidate: ${candidate || 'N/A'}
          ////Signal Message END////`);
          socket.emit('webrtc:signaling', sendingPacket); // viewer to caster
        }

      });
    }

  };

  const msg_test = async (packet) => {
    console.log('webrtc:socket msg test -', packet);

  };


  const zedCommander = (serialNumber, command) => {

    console.log('[zed:command] serialNumber :', serialNumber);
    socket.broadcast.to(serialNumber).emit('zed:command', command);

  };


  const onConnectionState = (senderId, serviceId, rtcStatus) => {

    console.log('onConnectionState >>>', senderId, serviceId, rtcStatus);

  };

  socket.on("webrtc:connection request", onConnectionRequest);
  socket.on("webrtc:signaling", onSignaling);
  socket.on("webrtc:msg-test", msg_test);
  socket.on("webrtc:connectionStateChanged", onConnectionState); // not yet used and not yet implemented. 추후 사용할 예정
  socket.on("zed:command", zedCommander);
  socket.on("echo", (packet) => {
    console.log('echo in webrtc', packet);
  })

};



function checkJSON_and_convert(maybeJSON){    //for the communication with python socketIO client
  if (typeof maybeJSON !== 'object'){
      console.log("recieved packet is not a object type. convert it to JSON.")
      try{
          maybeJSON = JSON.parse(maybeJSON); //this msg from c++ app (zed App)
      }catch(error){
          console.log("Error parsing JSON:", error);
          return -1;
      }
  }
  return maybeJSON;
} 