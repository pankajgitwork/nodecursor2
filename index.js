import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import FileStoreFactory from 'session-file-store';
import { dirname } from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import adminRoutes from './routes/adminRoute.js';
import userRoutes from './routes/userRoute.js';
import apiRoutes from './routes/apiRoute.js';
import cors from 'cors';
import { adminPath } from './routes/paths/adminPath.js';

const __filename=fileURLToPath(import.meta.url);
const __dirname=dirname(__filename);

const app=express();
app.use(cors());
app.options('*', cors());

const server=http.createServer(app); // wrap app in HTTP server
/* const io=new SocketIOServer(server, {
  cors: {
    origin: "*",            // allow any origin
    methods: ["GET", "POST"],// allowed handshake methods
    credentials: false      // set true if you need cookies
  }
}); */

const io = new SocketIOServer(server, {
  cors: { origin: "*" }
});

const FileStore=FileStoreFactory(session);

// Body parsing for JSON APIs
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// view engine + layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
app.set('layout', 'user/pages/layout/layout');


/*  =========== Session =========== */
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new FileStore({
    path: './sessions',
    retries: 2,
    ttl: 1*60,        // default session TTL = 5 minutes (in seconds)
    reapInterval: 1*60, // clean up expired sessions every 5 minutes
    reapAsync: true
  }),
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: true
    // no maxAge here → default sessions expire after 5 min via store.ttl
  }
}));
/*  =========== Session End =========== */


// static assets
app.use(express.static(path.join(__dirname, 'public')));

// mount page routes
app.use(userRoutes);
app.use(adminRoutes);

// mount API routes
app.use('/api', apiRoutes);

// WebSocket logic

const deviceMap={}; // { token: { deviceId: socket.id } }

io.on('connection', async (socket) => {
  const { token, role, deviceId }=socket.handshake.query;

  if (!token||!role) {
    socket.disconnect(true);
    return;
  }

  socket.join(token);

  // Map only receivers
  if (role==='receiver'&&deviceId) {
    if (!deviceMap[token]) {
      deviceMap[token]={};
    }

    deviceMap[token][deviceId]=socket.id;
  }


  const emitDeviceCount=async () => {
    const sockets=await io.in(token).fetchSockets();

    const receivers=sockets.filter(function (s) {
      return s.handshake.query.role==='receiver';
    });

    const count=receivers.length;
    const deviceIds=receivers.map(s => s.handshake.query.deviceId).filter(Boolean); // Only defined IDs

    io.to(token).emit('receiver-count', { count, deviceIds });
  };

  emitDeviceCount();

  socket.on('send-command', ({ token, deviceId, command }) => {
    let targetSocketId;

    if (deviceMap[token]&&deviceMap[token][deviceId]) {
      targetSocketId=deviceMap[token][deviceId];
    }

    if (targetSocketId) {

      io.to(targetSocketId).emit('execute-command', { from: deviceId, command });
    }
  });

  socket.on('disconnect', async () => {
    if (role==='receiver'&&deviceId&&deviceMap[token]?.[deviceId]) {
      delete deviceMap[token][deviceId];
      if (Object.keys(deviceMap[token]).length===0) {
        delete deviceMap[token];
      }
    }

    emitDeviceCount();
  });
});



// start server
const PORT=process.env.PORT;
server.listen(PORT, () => {
  // console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});