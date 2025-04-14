import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const ChatComponent = ({ gameId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:8000', {
      withCredentials: true,
      auth: {
        token: localStorage.getItem('token')
      }
    });
    setSocket(newSocket);

    // Join game room
    newSocket.emit('joinGame', { gameId, userId });

    // Message listener
    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      newSocket.off('newMessage');
      newSocket.disconnect();
    };
  }, [gameId, userId]);

  const sendMessage = () => {
    if (messageInput.trim() && socket) {
      const message = {
        gameId,
        playerId: userId,
        text: messageInput,
        timestamp: new Date().toISOString()
      };
      socket.emit('sendMessage', message);
      setMessageInput('');
    }
  };

  return (
    <div className="chat-container bg-gray-800 p-4 rounded-lg h-full flex flex-col">
      <div className="messages flex-grow overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <div key={i} className="message text-white mb-2">
            <strong className={msg.playerId === userId ? 'text-green-400' : 'text-blue-400'}>
              {msg.playerId === userId ? 'You' : 'Opponent'}: 
            </strong>
            <span className="ml-2">{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="flex mt-auto">
        <input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-grow p-2 rounded-l text-black"
          placeholder="Type a message..."
        />
        <button 
          onClick={sendMessage}
          className="bg-[#7fa650] text-white px-4 py-2 rounded-r hover:bg-[#8cf906]"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;