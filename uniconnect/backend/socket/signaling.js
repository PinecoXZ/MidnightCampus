/**
 * WebRTC signaling handler
 * Relays offer, answer, and ICE candidates between matched peers
 */
function setupSignaling(socket, io, activeRooms) {
    // Relay WebRTC offer
    socket.on('webrtc-offer', ({ offer }) => {
        const room = activeRooms.get(socket.id);
        if (room) {
            io.to(room.peerId).emit('webrtc-offer', { offer, fromId: socket.id });
        }
    });

    // Relay WebRTC answer
    socket.on('webrtc-answer', ({ answer }) => {
        const room = activeRooms.get(socket.id);
        if (room) {
            io.to(room.peerId).emit('webrtc-answer', { answer, fromId: socket.id });
        }
    });

    // Relay ICE candidate
    socket.on('ice-candidate', ({ candidate }) => {
        const room = activeRooms.get(socket.id);
        if (room) {
            io.to(room.peerId).emit('ice-candidate', { candidate, fromId: socket.id });
        }
    });
}

module.exports = { setupSignaling };
