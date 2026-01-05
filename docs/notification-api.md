# Notification API Documentation

## Overview
The Notification API provides endpoints for managing user notifications and preferences in the Productivity Suite.

## Base URL
All notification endpoints are prefixed with `/notifications` or `/user/preferences`.

## Authentication
All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Notification Endpoints

### Get Notifications
**GET** `/notifications`

Retrieve notifications for the authenticated user with pagination and filtering.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `unreadOnly` (boolean, optional): Show only unread notifications (default: false)
- `type` (string, optional): Filter by notification type
- `priority` (string, optional): Filter by priority (low, medium, high, urgent)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification_id",
        "type": "task_assigned",
        "title": "New Task Assigned",
        "message": "You have been assigned a new task: 'Complete project'",
        "isRead": false,
        "priority": "medium",
        "data": {
          "taskId": "task_id",
          "taskTitle": "Complete project"
        },
        "timestamp": "2024-01-15T10:30:00.000Z",
        "age": 3600000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Get Unread Count
**GET** `/notifications/unread-count`

Get the count of unread notifications for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### Mark Notifications as Read
**PUT** `/notifications/:id/read` - Mark specific notification as read
**PUT** `/notifications/read` - Mark all notifications as read

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "modifiedCount": 1
  }
}
```

### Delete Notification
**DELETE** `/notifications/:id`

Delete a specific notification.

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": {
    "deletedCount": 1
  }
}
```

### Get Notification Statistics
**GET** `/notifications/stats`

Get notification statistics for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "unread": 5,
    "byType": {
      "task_assigned": { "total": 15, "unread": 2 },
      "note_shared": { "total": 10, "unread": 1 },
      "file_uploaded": { "total": 25, "unread": 2 }
    }
  }
}
```

## User Preference Endpoints

### Get All Preferences
**GET** `/user/preferences`

Get all user preferences (notifications + theme).

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "notifications": {
        "enabled": true,
        "types": {
          "task_assigned": true,
          "task_completed": true,
          "note_shared": false
        },
        "delivery": {
          "realtime": true,
          "email": false
        }
      },
      "theme": "light"
    }
  }
}
```

### Get Notification Preferences
**GET** `/user/preferences/notifications`

Get notification preferences for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "enabled": true,
      "types": {
        "task_assigned": true,
        "task_completed": true,
        "task_due_soon": true,
        "note_shared": true,
        "note_updated": false,
        "file_uploaded": true,
        "file_shared": true,
        "chat_mention": true,
        "system_alert": true
      },
      "delivery": {
        "realtime": true,
        "email": false
      }
    }
  }
}
```

### Update Notification Preferences
**PUT** `/user/preferences/notifications`

Update notification preferences for the authenticated user.

**Request Body:**
```json
{
  "enabled": true,
  "types": {
    "task_assigned": true,
    "note_shared": false
  },
  "delivery": {
    "realtime": true,
    "email": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully",
  "data": {
    "preferences": {
      "enabled": true,
      "types": { ... },
      "delivery": { ... }
    }
  }
}
```

### Update Theme Preference
**PUT** `/user/preferences/theme`

Update theme preference for the authenticated user.

**Request Body:**
```json
{
  "theme": "dark"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Theme preference updated successfully",
  "data": {
    "theme": "dark"
  }
}
```

### Reset Notification Preferences
**POST** `/user/preferences/notifications/reset`

Reset notification preferences to default values.

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences reset to defaults",
  "data": {
    "preferences": {
      "enabled": true,
      "types": { ... },
      "delivery": { ... }
    }
  }
}
```

## Notification Types

The following notification types are supported:

- `task_assigned` - When a task is assigned to the user
- `task_completed` - When a task is completed
- `task_due_soon` - When a task is due soon
- `note_shared` - When a note is shared with the user
- `note_updated` - When a shared note is updated
- `file_uploaded` - When a file is uploaded
- `file_shared` - When a file is shared with the user
- `chat_mention` - When the user is mentioned in chat
- `system_alert` - System-wide notifications

## Priority Levels

- `low` - Low priority notifications
- `medium` - Medium priority notifications (default)
- `high` - High priority notifications
- `urgent` - Urgent notifications

## Real-time Notifications

When users are connected via Socket.io, they will receive real-time notifications through the following events:

### Client Events (Received)
- `new_notification` - New notification received
- `notifications_read` - Notifications marked as read

**Example `new_notification` event:**
```json
{
  "id": "notification_id",
  "type": "task_assigned",
  "title": "New Task Assigned",
  "message": "You have been assigned a new task",
  "priority": "medium",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes
- `INTERNAL_ERROR` - Server error
- `INVALID_REQUEST_BODY` - Invalid request body
- `NOTIFICATION_NOT_FOUND` - Notification not found
- `USER_NOT_FOUND` - User not found
- `INVALID_THEME` - Invalid theme value

## Rate Limiting

All notification endpoints are subject to rate limiting:
- 100 requests per 15 minutes per user
- Burst limit of 20 requests per minute

## Examples

### Get Recent Notifications
```bash
curl -X GET "http://localhost:3000/notifications?limit=10&unreadOnly=true" \
  -H "Authorization: Bearer your_jwt_token"
```

### Mark All Notifications as Read
```bash
curl -X PUT "http://localhost:3000/notifications/read" \
  -H "Authorization: Bearer your_jwt_token"
```

### Update Notification Preferences
```bash
curl -X PUT "http://localhost:3000/user/preferences/notifications" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "types": {
      "task_assigned": true,
      "note_shared": false
    }
  }'
```