const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  console.log('New client connected');

  let username;

  ws.on('message', function incoming(message) {
    console.log('Received:', message);
    
    if (!username) {
      username = message;
      // 发送新用户加入的通知消息给所有客户端
      const newUserMessage = `${username} joined the chat`;
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(newUserMessage);
        }
      });
      return;
    }

    const fullMessage = `${username}: ${message}`;

    // 广播收到的消息给所有连接的客户端
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        // 向所有客户端发送消息
        client.send(fullMessage);
      }
    });
  });

  ws.on('close', function() {
    if (username) {
      const userLeftMessage = `${username} left the chat`;
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(userLeftMessage);
        }
      });
    }
  });
});

server.listen(3000, function listening() {
  console.log('Server started on port 3000');
});
