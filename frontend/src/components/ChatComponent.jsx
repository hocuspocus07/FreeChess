import React, { useState, useEffect, useRef } from 'react';
import { getConversation, sendMessage, getInboxMessages, getUserDetails, getFriendshipStatus } from '../api.js';
import { useLocation, useNavigate } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { navigateOutline, sendOutline } from 'ionicons/icons';

const ChatComponent = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const messageEndRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [usernames, setUsernames] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showInbox, setShowInbox] = useState(true); // for mobile
  const location = useLocation();
  const navigate = useNavigate();
  const [profilePics, setProfilePics] = useState({});
  const [canChat, setCanChat] = useState(true);
  const [friendshipChecked, setFriendshipChecked] = useState(false);

  const handleClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  const handleBackClick = () => {
    setSelectedUser(null);
    navigate('/user-info');
  };

  useEffect(() => {
    let interval;
    if (userId && selectedUser) {
      interval = setInterval(() => {
        getConversation(userId, selectedUser)
          .then(data => setMessages(data.messages || []));
      }, 2000); // too lazy for sockets
    }
    return () => clearInterval(interval);
  }, [userId, selectedUser]);

  useEffect(() => {
    //if selectedUser is set and not in usernames/profilePics, fetch it
    if (
      selectedUser &&
      (!usernames[selectedUser] || !profilePics[selectedUser])
    ) {
      getUserDetails(selectedUser)
        .then(user => {
          setUsernames(prev => ({
            ...prev,
            [selectedUser]: user?.user?.username || user?.username || selectedUser,
          }));
          setProfilePics(prev => ({
            ...prev,
            [selectedUser]: user?.user?.profilepic || user?.profilepic || "6.png",
          }));
        })
        .catch(() => {
          setUsernames(prev => ({
            ...prev,
            [selectedUser]: selectedUser,
          }));
          setProfilePics(prev => ({
            ...prev,
            [selectedUser]: "6.png",
          }));
        });
    }
  }, [selectedUser, usernames, profilePics]);

  //check friendship status before chatting
  useEffect(() => {
    if (userId && selectedUser) {
      getFriendshipStatus(selectedUser)
        .then(status => {
          setCanChat(status === "accepted");
          setFriendshipChecked(true);
        })
        .catch(() => {
          setCanChat(false);
          setFriendshipChecked(true);
        });
    } else {
      setCanChat(true);
      setFriendshipChecked(false);
    }
  }, [userId, selectedUser]);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setShowInbox(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle ?user= param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userParam = params.get('user');
    if (userParam) {
      setSelectedUser(userParam);
      setShowInbox(false);
    }
  }, [location]);

  // Fetch inbox
  useEffect(() => {
    let interval;
    if (userId) {
      getInboxMessages(userId)
        .then(async data => {
          const sorted = (data.messages || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setInbox(sorted);
          // Fetch usernames for all users in inbox
          const userIds = Array.from(
            new Set(
              (data.messages || []).flatMap(msg => [
                msg.from_user,
                msg.to_user,
              ])
            )
          ).filter(id => id && id !== userId);
          const usernameMap = {};
          const profilePicMap = {};
          await Promise.all(
            userIds.map(async id => {
              if (!usernameMap[id]) {
                try {
                  const user = await getUserDetails(id);
                  usernameMap[id] = user?.user?.username || user?.username || id;
                  profilePicMap[id] = user?.user?.profilepic || user?.profilepic || `/avatar/6.png`;
                } catch {
                  usernameMap[id] = id;
                  profilePicMap[id] = `/avatar/6.png`;
                }
              }
            })
          );
          setUsernames(usernameMap);
          setProfilePics(profilePicMap);
        })
        .catch(() => setInbox([]));
        //too lazy for socket pt.2
          interval = setInterval(() => {
            getInboxMessages(userId)
              .then(async data => {
                setInbox(data.messages || []);
                // ...fetch usernames/profilePics if needed...
              })
              .catch(() => setInbox([]));
          }, 2000);
    }
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch conversation
  useEffect(() => {
    if (userId && selectedUser) {
      getConversation(userId, selectedUser)
        .then(data => setMessages(data.messages || []))
        .catch(() => setMessages([]));
    }
  }, [userId, selectedUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (messageInput.trim()) {
      await sendMessage(userId, selectedUser, messageInput);
      setMessages([
        ...messages,
        {
          from_user: userId,
          to_user: selectedUser,
          text: messageInput,
          timestamp: new Date().toISOString(),
        },
      ]);
      setMessageInput('');
    }
  };

  // Helper to get username
  const getUsername = (id) => {
    if (id === userId) return "You";
    return usernames[id] || id;
  };

  // Inbox list
  const InboxList = (
    <div className="w-screen sm:w-1/4 h-screen border-r overflow-y-auto scrollbar-custom bg-[#1a1a1a]">
      <div className='flex'>
        <button
          className="text-lime-400 font-extrabold text-3xl hover:cursor-pointer"
          onClick={handleBackClick}
          style={{ minWidth: 40 }}
        >
          ←
        </button>
        <h2 className="text-lg flex items-center justify-center font-bold text-white w-full p-4">Inbox</h2>
      </div>
      {inbox.length === 0 && (
        <div className="p-4 text-gray-400">No conversations yet.</div>
      )}
      {inbox.map((msg, i) => {
        const otherUser = String(msg.from_user) === String(userId) ? msg.to_user : msg.from_user;
        if (String(otherUser) === String(userId)) return null;
        return (
          <div
            key={i}
            className={`p-2 border-y-2 border-gray-400 cursor-pointer hover:text-black hover:bg-gray-200 ${selectedUser === otherUser ? 'bg-gray-300' : ''
              }`}
            onClick={() => {
              setSelectedUser(otherUser);
              if (isMobile) setShowInbox(false);
            }}
          >
            <div className='flex'>
              <img src={profilePics[otherUser] ? `/avatar/${profilePics[otherUser]}` : '/avatar/6.png'} alt="" className="h-10 w-10 rounded-full border-2 border-lime-400 mr-4" />
              <div>
                <div className="font-semibold text-lime-500">{getUsername(otherUser)}</div>
                <div className="text-sm text-white truncate">{msg.text}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const selectedUserAvatar = profilePics[selectedUser]
    ? `/avatar/${profilePics[selectedUser]}`
    : "/avatar/6.png";

  // Chat window
  const ChatWindow = (
    <div className="flex-1 flex flex-col bg-gray-800 h-screen">
      {selectedUser ? (
        friendshipChecked ? (
          canChat ? (
            <>
              <div className="flex items-center px-4 py-3 rounded-t-lg mb-2" style={{ background: "#222", minHeight: "56px" }}>
                {isMobile && (
                  <button
                    className="text-lime-400 font-bold text-3xl mr-4"
                    onClick={() => setShowInbox(true)}
                    style={{ minWidth: 40 }}
                  >
                    ←
                  </button>
                )}
                <div className='flex items-center justify-center' onClick={() => handleClick(selectedUser)}>
                  <img
                    src={selectedUserAvatar}
                    className="h-10 w-10 rounded-full border-2 border-lime-400 mr-4"
                    alt=""
                  />
                  <span className="text-white font-bold text-lg">{getUsername(selectedUser)}</span></div>
              </div>
              <div className="messages flex-grow overflow-y-auto mb-4 scrollbar-custom">
                {messages.map((msg, i) => {
                  const isMe = String(msg.from_user) === String(userId);
                  const avatar = profilePics[msg.from_user]
                    ? `/avatar/${profilePics[msg.from_user]}`
                    : "/avatar/6.png";
                  const myAvatar = profilePics[userId]
                    ? `/avatar/${profilePics[userId]}`
                    : "/avatar/6.png";
                  return (
                    <div
                      key={i}
                      className={`message mb-2 flex ${isMe ? 'justify-end' : 'justify-start'} items-end`}
                    >
                      {!isMe && (
                        <div className="h-10 w-10 rounded-full overflow-hidden mr-2">
                          <img src={avatar} alt="User Avatar" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-3 py-2 max-w-xs break-words ${isMe
                          ? 'bg-lime-600 text-white self-end'
                          : 'bg-blue-600 text-white self-start'
                          }`}
                      >
                        <span className="ml-2">{msg.text}</span>
                      </div>
                      {isMe && (
                        <div className="h-10 w-10 rounded-full overflow-hidden ml-2">
                          <img src={myAvatar} alt="User Avatar" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>
              <div className="flex mt-auto bg-gray-900 p-2">
                <input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-grow p-2 text-white rounded-2xl bg-gray-700 mr-2"
                  placeholder="Type a message..."
                />
                <button
                  onClick={handleSend}
                  className="bg-green-600 font-extrabold text-2xl text-white px-4 py-2 rounded-full hover:bg-[#8cf906]"
                >
                  <IonIcon icon={sendOutline} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-red-400 font-bold text-lg">
              You can only chat with your friends.
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 font-bold text-lg">
            Checking friendship status...
          </div>
        )
      ) : (
        <div className="p-4 text-gray-500">Select a conversation</div>
      )}
    </div>
  );

  // Responsive rendering
  if (isMobile) {
    return showInbox ? InboxList : ChatWindow;
  }
  // Desktop: show both
  return (
    <div className="flex h-full">
      {InboxList}
      {ChatWindow}
    </div>
  );
};

export default ChatComponent;