import mongoose from "mongoose";
import { NotificationModel } from "../Models/notification.model.js";

export const getNotification = async (req, res) =>{
  try {
    const {cursor, limit} = req.query;

    const pageSize = Math.min(Number(limit) || 15, 100);
    const query = {recipient: req.user.id};
    if(cursor){
      if(!mongoose.Types.ObjectId.isValid(cursor)){
        return res.status(400).json({success:false, message:"Invalid Cursor"})
      }
      query._id = {$lt: cursor}
    }
    const notifications = await NotificationModel.find(query)
    .sort({_id:-1})
    .limit(pageSize + 1)
    
    const hasMore = notifications.length > pageSize;
    const page = hasMore ? notifications.slice(0, pageSize) : notifications;
    const nextCursor = hasMore ? page[page.length - 1]._id : null;

    return res.status(200).json({
      success: true,
      notifications: page,
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.log("error fetching notifications", error);
    return res.status(500).json({
      success:false,
      message:"Failed to fetch notifications"
    })
    
  }
}

export const getUnreadNotificationCount = async(req, res) =>{
  try {
    const count = await NotificationModel.countDocuments({recipient:req.user.id, read: false});

    return res.status(200).json({success: true, count})
  } catch (error) {
    console.log("Error counting unread notifications", error);
    return res.status(500).json({success:false, message:"Failed to count unread notifications"})
    
  }
}
export const readAllNotifications = async (req, res) => {
  try {
    await NotificationModel.updateMany(
      {
        recipient: req.user.id,
        read: false,
      },
      { $set: { read: true } },
    );

    return res.status(200).json({
      success: true,
      message: "All notification marked as read",
    });
  } catch (error) {
    console.log("Error marking notification as read", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

export const clearAllNotification = async (req, res) => {
  try {
    await NotificationModel.deleteMany({
      recipient: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    console.log("Error deleting notification", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear notification",
    });
  }
};
export const readNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: req.user.id,
      },
      {
        $set: { read: true },
      },
      {
        new: true,
      },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.log("Error reading notification:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to read notification",
    });
  }
};
