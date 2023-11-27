const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const path = require("path");
const ExternalProcess = require(path.join(__dirname, "runExternalProcess.js"));

// middlewares
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server);


let robotProfile={
  "alias": "robot1",
  "serialNumber": "1234567890",
  "createdAt":"today" 
}

app.get('/', function(req, res) {
  res.send("Hello world! Lala Seth is here!");
});

io.on('connection', (socket) => {

  console.log('Client connected - id: ', socket.id);

  socket.on('chat message', (msg) => {
    console.log('Message:', msg);
    io.emit('chat message', msg);
  });

  socket.on('update-module-portal', (args) => {
    console.log('socket message with update-module-portal header received')
    console.log('args:', args);
    let response={};
    if(args.hasOwnProperty("request")){
      //convert string to json for args.profile
      robotProfile = JSON.parse(args.profile);
      response.robotProfile = robotProfile;
    }
    io.emit("robot-dashboard", response);    
  });

  socket.on('settings', (args) => {
    console.log('socket message with settings header received')
    console.log('args:', args);
    let response={};
    if(args.hasOwnProperty("robotProfile")){
      //convert string to json for args.profile
      response.robotProfile = robotProfile;
    }
    io.emit("robot-dashboard", response);
  });

  socket.on('dashboard', (args) => {
    io.emit("robot-dashboard", args);

  });

  socket.on('robot', (args) => {
    console.log('socket message with robot header received')
    console.log('robot:', args);

    io.emit("robot", "dashboard",args);

    let response = {};

    // if(args.hasOwnProperty("connect")){
    //   response.isRobotConnected = args.connect;
    //   response.isNetworkConnected = args.connect;
    //   if(args.connect){
    //     response.robotOperationStatus = 1;
    //     response.robotControlMode = "remote";
    //   } else {
    //     response.robotOperationStatus = 0;
    //     response.robotControlMode = "not available";
    //   }
    // }
    // if(args.hasOwnProperty("power")){
    //   response.isRobotPoweredOn = args.power;
    //   if (args.power){
    //     response.robotOperationStatus = 5;
    //   } else {
    //     response.robotOperationStatus = 3;
    //   }
    // }
    // if(args.hasOwnProperty("program")){
    //   if(args.program === "start"){
    //     response.robotProgramStatus = "running";
    //     ExternalProcess.runHelloWorldProcess();
    //   // ExternalProcess.runHelloWorldProcessSync();

    //   }else if(args.program === "stop"){
    //     response.robotProgramStatus = "stopped";
    //   }
      
    // }

    


    // // event.reply("robot-dashboard", response);
    // io.emit("robot-dashboard", response);
    // console.log("respose sent: ",response);





  });

  socket.on('disconnect', () => {
    console.log('User disconnected - id: ', socket.id);
  });
});

const port = 3001;
server.listen(port, () => {
  console.log(`Socket.IO server listening on port ${port}`);
});

