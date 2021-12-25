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
  
  io.on("connection",(socket)=>{
      socket.on("create-room",(name)=>{
        const newId = uuidv4();
          socket.join(newId);
          rooms[newId]=[{name : name , id : socket.id,position : 0}];
          validRoomIds.push(newId);
          socket.emit("take-id",newId);
          socket.emit("take-players",rooms[newId])
          setTimeout(()=>{
            delete rooms[newId];
            delete times[newId];
          },900000)
      })

      socket.on("join-room",(data)=>{
        if(validRoomIds.includes(data.roomId)){
          io.to(data.roomId).emit("update-players",{name: data.name,id : socket.id});
          rooms[data.roomId].push({name : data.name , id : socket.id , position : 0});
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

      socket.on("start-match",(roomId)=>{
          validRoomIds=validRoomIds.filter(id=> id != roomId);
          io.to(roomId).emit("start-game");
          
      })
      socket.on("take-characters",(data)=>{
        io.to(data.roomId).emit("manipulate-position",{playerId : data.id, currentCharacters : data.currentCharacters});
      })
      socket.on("complete",(data)=>{
        
        let maxPosition=0;
        rooms[data.roomId].forEach(each=>{
          if(each.position > maxPosition) maxPosition=each.position;
        })
        maxPosition++;
        rooms[data.roomId]=rooms[data.roomId].map(each=>{
          return {...each , position : (each.id === data.id ) ? maxPosition : each.position}
        })
        if(maxPosition == 1) maxPosition=`${maxPosition}st`;
        else if(maxPosition == 2) maxPosition=`${maxPosition}nd`;
        else if(maxPosition == 3) maxPosition=`${maxPosition}rd`;
        else  maxPosition=`${maxPosition}th`;
        io.to(data.roomId).emit("finish",{id : data.id , wpm : data.wpm , position : maxPosition});
        
        
      })
  })
  httpServer.listen(process.env.PORT || 8080);