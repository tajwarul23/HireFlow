import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../../Auth/auth.context";
import {
  getNotificationApi,
  getUnreadNotificationCountApi,
  markAllNotificationReadApi,
  markNotificationReadApi,
  clearAllNotificationApi,
} from "../Services/notification.api.js";

const NOTIFICATIONS_KEY = ["notifications"];
const UNREAD_COUNT_KEY = ["notifications", "unread-count"];

export const useNotifications = ({ enabled = true } = {}) => {
  const { user } = useContext(AuthContext);

  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: ({ pageParam }) => getNotificationApi({ cursor: pageParam, limit: 15 }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: !!user?.id && enabled,
    staleTime: 30 * 1000,
  });
};

// Polls in the background so the badge updates without the user opening the panel.
export const useUnreadNotificationCount = () => {
  const { user } = useContext(AuthContext);

  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: getUnreadNotificationCountApi,
    enabled: !!user?.id,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useClearAllNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearAllNotificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};
