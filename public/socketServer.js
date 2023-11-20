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


app.get('/', function(req, res) {
  res.send("Hello world! Lala Seth is here!");
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', (msg) => {
    console.log('Message:', msg);
    io.emit('chat message', msg);
  });

  socket.on('robot', (args) => {
    console.log('socket message with robot header received')
    console.log('robot:', args);

    let response = {};

    if(args.hasOwnProperty("connect")){
      response.isRobotConnected = args.connect;
      response.isNetworkConnected = args.connect;
      if(args.connect){
        response.robotOperationStatus = 1;
        response.robotControlMode = "remote";
      } else {
        response.robotOperationStatus = 0;
        response.robotControlMode = "not available";
      }
    }
    if(args.hasOwnProperty("power")){
      response.isRobotPoweredOn = args.power;
      if (args.power){
        response.robotOperationStatus = 5;
      } else {
        response.robotOperationStatus = 3;
      }
    }
    if(args.hasOwnProperty("program")){
      if(args.program === "start"){
        response.robotProgramStatus = "running";
        ExternalProcess.runHelloWorldProcess();
      // ExternalProcess.runHelloWorldProcessSync();

      }else if(args.program === "stop"){
        response.robotProgramStatus = "stopped";
      }
      
    }
    // event.reply("robot-dashboard", response);
    io.emit("robot-dashboard", response);
    console.log("respose sent: ",response);





  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const port = 3001;
server.listen(port, () => {
  console.log(`Socket.IO server listening on port ${port}`);
});

