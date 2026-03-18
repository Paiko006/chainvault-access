import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ReactNode } from "react";

export type NotificationType = "success" | "info" | "error" | "warning";

export interface Notification {
  id: string;
  title: string;
  description?: string;
  time: number;
  type: NotificationType;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "time" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotifications = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [
        {
          id: "welcome-1",
          title: "Welcome to ChainVault",
          description: "Your secure decentralized data vault is ready.",
          time: Date.now(),
          type: "info",
          read: false
        }
      ],
      addNotification: (n) => 
        set((state) => ({
          notifications: [
            {
              ...n,
              id: Math.random().toString(36).substring(2, 9),
              time: Date.now(),
              read: false
            },
            ...state.notifications
          ].slice(0, 50) // Keep last 50
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true }))
        })),
      clearAll: () => set({ notifications: [] })
    }),
    {
      name: "chainvault-notifications"
    }
  )
);
