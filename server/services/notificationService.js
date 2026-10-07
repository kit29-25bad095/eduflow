const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets/socketHandler');

const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedEntity = null,
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedEntity,
    });

    // Real-time delivery
    emitToUser(recipient, 'new_notification', notification);

    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
