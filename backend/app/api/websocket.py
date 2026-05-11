from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, Set
import json
from app.core.security import verify_token

router = APIRouter(prefix="/ws", tags=["websocket"])

# Store active WebSocket connections per user
active_connections: Dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        print(f"✅ User {user_id} connected. Active connections: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"❌ User {user_id} disconnected")

    async def broadcast_to_user(self, user_id: str, message: dict):
        """Send message to all connections of a specific user"""
        if user_id in self.active_connections:
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message: {e}")
                    self.active_connections[user_id].discard(connection)


manager = ConnectionManager()


@router.websocket("/messages/{user_id}")
async def websocket_messages(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time message updates.
    
    Connect with: ws://localhost:8000/ws/messages/{user_id}?token={access_token}
    
    Server sends:
    - message_created: {type: "message_created", data: {...}}
    - message_deleted: {type: "message_deleted", data: {message_id: "..."}}
    - message_updated: {type: "message_updated", data: {...}}
    """
    try:
        # Verify token
        token_data = verify_token(token)
        if not token_data or str(token_data.user_id) != user_id:
            await websocket.close(code=1008, reason="Unauthorized: token does not match user")
            return

        # Connect
        await manager.connect(user_id, websocket)

        # Listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"📨 Received from {user_id}: {message}")
            # Server can receive keepalive or other messages here

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        manager.disconnect(user_id, websocket)


async def notify_message_created(requester_id: str, commitment_data: dict):
    """Notify user when a new commitment/message is created on their request"""
    await manager.broadcast_to_user(requester_id, {
        "type": "message_created",
        "data": commitment_data
    })


async def notify_message_updated(requester_id: str, commitment_data: dict):
    """Notify user when a commitment/message is updated"""
    await manager.broadcast_to_user(requester_id, {
        "type": "message_updated",
        "data": commitment_data
    })


async def notify_message_deleted(requester_id: str, commitment_id: str):
    """Notify user when a commitment/message is deleted"""
    await manager.broadcast_to_user(requester_id, {
        "type": "message_deleted",
        "data": {"commitment_id": commitment_id}
    })
