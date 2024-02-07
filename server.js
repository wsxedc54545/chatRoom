const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = []; // 用來追蹤在線用戶的列表

wss.on('connection', function connection(ws) {
  console.log('New client connected');

  let username;

  ws.on('message', function incoming(message) {
    console.log('Received:', message);

    if (!username) {
      username = message;
      const newUserMessage = `${username} joined the chat`;
      users.push(username); // 新用戶加入時，將其添加到用戶列表中
      updateUsers('joined', newUserMessage); // 更新用戶列表並廣播

      return;
    }

    const fullMessage = `${username}: ${message}`;

    // 广播收到的消息给所有连接的客户端
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        // 向所有客户端发送消息
        client.send(JSON.stringify({ type: 'message', data: fullMessage }));
      }
    });
  });

  ws.on('close', function() {
    if (username) {
      const index = users.indexOf(username);
      const userLeftMessage = `${username} left the chat`;
      if (index !== -1) {
        users.splice(index, 1); // 從用戶列表中移除離開的用戶
        updateUsers('left',userLeftMessage); // 更新用戶列表並廣播
      }
    }
  });

  function updateUsers(type, msg) {
    const message = JSON.stringify({ type: 'userList', data: users.map(user => user.toString()) });
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        if (msg) {
          client.send(JSON.stringify({ type, data: msg }));
        }
        client.send(message, { binary: false }); // 指定消息的编码格式为UTF-8
      }
    });
  }
  
});

server.listen(3000, function listening() {
  console.log('Server started on port 3000');
});
