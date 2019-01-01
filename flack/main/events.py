import time

from flask import session, request
from flask_socketio import emit, send, join_room, leave_room, disconnect
from .. import socketio

from collections import deque


# server memory
USERS = {}
CHANNELS = {'Open': deque([], maxlen=100)}


@socketio.on('userdata')
def user_data(data):
    USERS[data['username']] = request.sid
    emit('logged', {'users': len(USERS)}, broadcast=True)

@socketio.on('new channel')
def new_channel(data):
    if data['name'] in CHANNELS:
        emit('channel exist', data)
    else:
        CHANNELS[data['name']] = deque(maxlen=100)
        emit('new channel', {'name': data['name']}, broadcast=True)

@socketio.on('new msg')
def new_msg(data):
    if 'channel' in data:
        data['created_at'] = int(time.time())
        CHANNELS[data['channel']].append(data)
        emit('msg', data, broadcast=True)

@socketio.on('get channels')
def get_channels():
    emit('channels', list(CHANNELS.keys()))


@socketio.on('get msgs')
def get_msgs(data):
    if 'name' in data:
        emit('msgs', list(CHANNELS[data['name']]))

@socketio.on('logout')
def disconnect(data):
    USERS.pop(data['userName'])
    emit('logged', {'users': len(USERS)}, broadcast=True)
