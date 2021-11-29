const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const {v4 : uuidv4} = require('uuid')

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }});
  let rooms={};
  let validRoomIds=[];
  let times={};
  // const startCountDown=(id)=>{
  //   setInterval(()=>{
  //     times[id]--;
  //     io.to(id).emit("update-time",times[id]);
  //    },1000);
  // }
  io.on("connection",(socket)=>{
      socket.on("create-room",(name)=>{
        const newId = uuidv4();
          socket.join(newId);
          rooms[newId]=[{name : name , id : socket.id}];
          // times[newId]=15;
          validRoomIds.push(newId);
          socket.emit("take-id",newId);
          socket.emit("take-players",rooms[newId])
      })

      socket.on("join-room",(data)=>{
        if(validRoomIds.includes(data.roomId)){
          io.to(data.roomId).emit("update-players",{name: data.name,id : socket.id});
          rooms[data.roomId].push({name : data.name , id : socket.id});
          if(rooms[data.roomId].length === 2) times[data.roomId]=new Date(); 
          socket.join(data.roomId);
          socket.emit("proceed",true);
        }else{
            socket.emit("proceed",false);
        }
      })

      socket.on("give-players",(roomId)=>{
        socket.emit("take-players",rooms[roomId]);
        io.to(roomId).emit("start-timer",times[roomId]);

      })
  })
  httpServer.listen(process.env.PORT || 8080);