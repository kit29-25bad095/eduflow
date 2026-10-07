let ioInstance = null;
const userSockets = new Map(); // userId -> Set of socketIds

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client identifies itself after authentication
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
        socket.userId = userId;
      }
    });

    // Course room subscription
    socket.on('join_course', (courseId) => {
      if (courseId) {
        socket.join(`course_${courseId}`);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });
  });

  return io;
};

// Emit real-time event to a specific user
const emitToUser = (userId, event, payload) => {
  if (ioInstance && userId) {
    ioInstance.to(`user_${userId.toString()}`).emit(event, payload);
  }
};

// Emit to an entire course room
const emitToCourse = (courseId, event, payload) => {
  if (ioInstance && courseId) {
    ioInstance.to(`course_${courseId.toString()}`).emit(event, payload);
  }
};

// Broadcast to everyone
const broadcastEvent = (event, payload) => {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  }
};

module.exports = {
  initSocket,
  emitToUser,
  emitToCourse,
  broadcastEvent,
};
