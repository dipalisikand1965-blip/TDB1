"""
Real-time WebSocket Notifications for Service Desk
Provides instant ticket updates to all connected agents

Production-Ready with:
- Connection health monitoring via heartbeat
- Graceful handling of disconnections
- Support for long-polling fallback
- Detailed connection logging
"""

import socketio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import json
import os

logger = logging.getLogger(__name__)

# Create Socket.IO server with production-ready configuration
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False,
    # Production settings for stability
    ping_timeout=30,      # Time to wait for pong before considering connection dead
    ping_interval=25,     # How often to ping clients
    max_http_buffer_size=1_000_000,  # 1MB max message size
    # Allow polling transport for reliability behind proxies/load balancers
    allow_upgrades=True,
    http_compression=True
)

# Track connected agents with metadata
connected_agents: Dict[str, Dict[str, Any]] = {}  # sid -> {agent_id, connected_at, last_heartbeat}


class NotificationManager:
    """Manages real-time notifications for the Service Desk"""
    
    @staticmethod
    async def emit_new_ticket(ticket_data: dict):
        """Broadcast new ticket to all connected agents"""
        try:
            await sio.emit('ticket:new', {
                'type': 'new_ticket',
                'ticket': ticket_data,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"Emitted new ticket: {ticket_data.get('ticket_id')}")
        except Exception as e:
            logger.error(f"Failed to emit new ticket: {e}")
    
    @staticmethod
    async def emit_ticket_update(ticket_id: str, update_type: str, data: dict):
        """Broadcast ticket update to all connected agents"""
        try:
            await sio.emit('ticket:update', {
                'type': update_type,
                'ticket_id': ticket_id,
                'data': data,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"Emitted ticket update: {ticket_id} - {update_type}")
        except Exception as e:
            logger.error(f"Failed to emit ticket update: {e}")
    
    @staticmethod
    async def emit_new_message(ticket_id: str, message: dict, channel: str = 'internal'):
        """Broadcast new message to all connected agents"""
        try:
            await sio.emit('ticket:message', {
                'type': 'new_message',
                'ticket_id': ticket_id,
                'message': message,
                'channel': channel,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"Emitted new message for ticket: {ticket_id}")
        except Exception as e:
            logger.error(f"Failed to emit new message: {e}")
    
    @staticmethod
    async def emit_agent_notification(agent_id: str, notification: dict):
        """Send notification to specific agent"""
        # Find agent's socket ID
        for sid, agent_info in connected_agents.items():
            if agent_info.get('agent_id') == agent_id:
                try:
                    await sio.emit('notification', notification, room=sid)
                    logger.info(f"Sent notification to agent: {agent_id}")
                except Exception as e:
                    logger.error(f"Failed to send notification to agent: {e}")
                break
    
    @staticmethod
    async def broadcast_stats_update(stats: dict):
        """Broadcast updated stats to all agents"""
        try:
            await sio.emit('stats:update', {
                'stats': stats,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        except Exception as e:
            logger.error(f"Failed to broadcast stats: {e}")


# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    """Handle new WebSocket connection"""
    # Extract useful info from environ for debugging
    transport = environ.get('asgi.scope', {}).get('query_string', b'').decode()
    user_agent = dict(environ.get('asgi.scope', {}).get('headers', [])).get(b'user-agent', b'').decode()[:50]
    
    logger.info(f"🔌 Client connected: {sid} (transport hint in query: {transport[:50] if transport else 'none'})")
    
    # Store connection metadata
    connected_agents[sid] = {
        'agent_id': None,
        'connected_at': datetime.now(timezone.utc).isoformat(),
        'last_heartbeat': datetime.now(timezone.utc).isoformat(),
        'user_agent': user_agent
    }
    
    await sio.emit('connection:status', {
        'status': 'connected', 
        'sid': sid,
        'server_time': datetime.now(timezone.utc).isoformat()
    }, room=sid)


@sio.event
async def disconnect(sid):
    """Handle WebSocket disconnection"""
    if sid in connected_agents:
        agent_info = connected_agents.pop(sid)
        agent_id = agent_info.get('agent_id', 'unregistered')
        logger.info(f"🔌 Client disconnected: {agent_id} ({sid})")
    else:
        logger.info(f"🔌 Unknown client disconnected: {sid}")


@sio.event
async def heartbeat(sid, data):
    """Handle heartbeat from client to keep connection alive"""
    if sid in connected_agents:
        connected_agents[sid]['last_heartbeat'] = datetime.now(timezone.utc).isoformat()
        # Respond with server time for latency measurement
        await sio.emit('heartbeat:ack', {
            'client_timestamp': data.get('timestamp'),
            'server_timestamp': datetime.now(timezone.utc).timestamp() * 1000
        }, room=sid)


@sio.event
async def register_agent(sid, data):
    """Register agent with their ID for targeted notifications"""
    agent_id = data.get('agent_id', sid)
    if sid in connected_agents:
        connected_agents[sid]['agent_id'] = agent_id
    else:
        connected_agents[sid] = {
            'agent_id': agent_id,
            'connected_at': datetime.now(timezone.utc).isoformat(),
            'last_heartbeat': datetime.now(timezone.utc).isoformat()
        }
    logger.info(f"✅ Agent registered: {agent_id} ({sid})")
    await sio.emit('registration:success', {'agent_id': agent_id}, room=sid)


@sio.event
async def subscribe_ticket(sid, data):
    """Subscribe agent to a specific ticket's updates"""
    ticket_id = data.get('ticket_id')
    if ticket_id:
        await sio.enter_room(sid, f'ticket:{ticket_id}')
        logger.info(f"Agent {sid} subscribed to ticket: {ticket_id}")


@sio.event
async def unsubscribe_ticket(sid, data):
    """Unsubscribe agent from a ticket's updates"""
    ticket_id = data.get('ticket_id')
    if ticket_id:
        await sio.leave_room(sid, f'ticket:{ticket_id}')
        logger.info(f"Agent {sid} unsubscribed from ticket: {ticket_id}")


@sio.event
async def typing_start(sid, data):
    """Broadcast typing indicator to ticket subscribers"""
    ticket_id = data.get('ticket_id')
    agent_name = data.get('agent_name', 'Agent')
    if ticket_id:
        await sio.emit('typing:start', {
            'ticket_id': ticket_id,
            'agent_name': agent_name
        }, room=f'ticket:{ticket_id}', skip_sid=sid)


@sio.event
async def typing_stop(sid, data):
    """Stop typing indicator"""
    ticket_id = data.get('ticket_id')
    if ticket_id:
        await sio.emit('typing:stop', {
            'ticket_id': ticket_id
        }, room=f'ticket:{ticket_id}', skip_sid=sid)


# Create notification manager instance
notification_manager = NotificationManager()
