import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        const raw = res.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.notifications || []);
        const unread = typeof raw?.unreadCount === 'number'
          ? raw.unreadCount
          : list.filter((n) => !n.read && !n.is_read).length;
        setNotifications(list);
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);

      const socket = getSocket();

      const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        showToast(notification.title, notification.message, 'info');
      };

      const handleNewSubmission = (data) => {
        showToast(
          'New Submission Received',
          `${data.studentName} submitted "${data.assignmentTitle}" in ${data.courseTitle}`,
          'success'
        );
        fetchNotifications();
      };

      const handleSubmissionGraded = (data) => {
        showToast(
          'Assignment Graded! 🎉',
          `Your assignment "${data.assignmentTitle}" was graded: ${data.marks}/${data.maxMarks}`,
          'success'
        );
        fetchNotifications();
      };

      socket.on('new_notification', handleNewNotification);
      socket.on('new_submission', handleNewSubmission);
      socket.on('submission_graded', handleSubmissionGraded);

      return () => {
        clearInterval(interval);
        socket.off('new_notification', handleNewNotification);
        socket.off('new_submission', handleNewSubmission);
        socket.off('submission_graded', handleSubmissionGraded);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  const showToast = (title, message, type = 'info') => {
    setActiveToast({ title, message, type, id: Date.now() });
    setTimeout(() => {
      setActiveToast(null);
    }, 5000);
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        showToast,
      }}
    >
      {children}
      {/* Real-time Toast Banner */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-700 animate-bounce duration-300 flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 animate-ping" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-indigo-300">{activeToast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{activeToast.message}</p>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
