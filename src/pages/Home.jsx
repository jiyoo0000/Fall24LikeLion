import React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import {useNavigate} from 'react-router-dom';
import "../styles/Home.css";
import { Avatar } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/authContext';
import { doSignOut } from '../firebase/auth'
import useWebSocket, { ReadyState } from 'react-use-websocket';
import axios from 'axios';

// TODO: Clean up Home Component

const Home = () => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL.replace(/^wss:/, 'https:'); //process.env.REACT_APP_BACKEND_URL;
  const { currentUser } = useAuth();
  // initial socket url
  const [socketUrl, setSocketUrl] = useState(process.env.REACT_APP_BACKEND_URL);
  // state to store the message history
  const [messageHistory, setMessageHistory] = useState([]);

  // state to store the message to be sent
  const [message, setMessage] = useState('');
  const [classes, setClasses] = useState([]); // State for enrolled classes
  const [currentClass, setCurrentClass] = useState(null);
  const [currentClassId, setCurrentClassId] = useState(null);
  const [chatlog, setChatlog] = useState([])


  // useWebSocket hook to connect to the websocket
  const { sendMessage,
      sendJsonMessage,
      lastMessage,
      lastJsonMessage,
      readyState,
      getWebSocket, } = useWebSocket(socketUrl, {
        onOpen: () => console.log('websocket opened'),
        queryParams: { //sends the user_id and name as query params
            user_id: currentUser.uid,
            name: currentUser.displayName,
            userClasses: classes.map(course => course._id),
        }
  });

  // useEffect to update the message history when a new message is received
  useEffect(() => {
      if (lastMessage !== null) {
          const m = JSON.parse(lastMessage.data);
          if (m.message.sent_uid !== currentUser.uid && m.course === currentClassId) {
              setChatlog((prev) => prev.concat(m.message));
              console.log(m);
              console.log(currentUser.uid);
          }
      }
  }, [lastMessage, currentUser]);

  // function to open the socket connection to the echo route
  const handleClickSetSocketUrl = useCallback(
    () => setSocketUrl(process.env.REACT_APP_BACKEND_URL + '/echo'),
    []
  );

  useEffect(() => {
    if (classes.length > 0) {
      handleClickSetSocketUrl();
    }
  }, [classes]);

  const handleClickCloseSocket = useCallback(() => getWebSocket().close(), [getWebSocket]);

  // all the available connection states for the websocket
  const connectionStatus = {
      [ReadyState.CONNECTING]: 'Connecting',
      [ReadyState.OPEN]: 'Open',
      [ReadyState.CLOSING]: 'Closing',
      [ReadyState.CLOSED]: 'Closed',
      [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  // Fetch enrolled courses on component mount
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!currentUser || !currentUser.uid) return; // Wait until currentUser and uid are available

      try {
        const response = await axios.get(`${BACKEND_URL}/course/enrolled`, {
          headers: { 'Content-Type': 'application/json' },
          params: { uid: currentUser.uid },
        });
        if (response.data) {
          setClasses(response.data);
        }
      } catch (error) {
        console.error("Error fetching enrolled courses:", error);
      }
    };

  const fetchChats = async () => {
      if (!currentClassId) return;

      try {
          const response = await axios.get(`${BACKEND_URL}/chatroom/chatlog`, {
              headers: { 'Content-Type': 'application/json' },
              params: { courseID: currentClassId },
          });
          if (response.data) {
              setChatlog(response.data);
              console.log(response.data);
          }
      } catch (error) {
          console.error("Error fetching chatlog", error);
      }
  }

      fetchChats();

    fetchEnrolledCourses();
  }, [currentUser, currentClassId]);

  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const handleClassSelect = (course_name, course_id) => {
    setCurrentClass(course_name);
    setCurrentClassId(course_id);
    console.log('handle:', currentClassId);
    if (!messages[course_name]) {
      setMessages((prev) => ({ ...prev, [course_name]: [] }));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && currentClass) {
      // Update local messages state
      setMessages((prevMessages) => ({
        ...prevMessages,
        [currentClass]: [...(prevMessages[currentClass] || []), input], // Ensure currentClass array exists
      }));

      setChatlog((prev) => prev.concat(
          {sent_msg: input, sent_uid: currentUser.uid, sent_name: currentUser.displayName}));
  
      // Send message through WebSocket
      sendJsonMessage({
        message: input,
        course: currentClassId,
      });
  
      // Clear the input field
      setInput("");
    }
  };

    const AlwaysScrollToBottom = () => {
        const elementRef = useRef();
        useEffect(() => elementRef.current.scrollIntoView());
        return <div ref={elementRef} />;
    };

  return (
    <div className="container">
      <div className="class-list">
        <h3>Conversations</h3>
        {classes.length === 0 ? (
          <p>No classes available.</p> // Message when classes array is empty
        ) : (
          <ul>
            {classes.map((course) => (
              <li
                key={course._id}
                onClick={() => handleClassSelect(course.course_name, course._id)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s",
                  marginTop: "10px",
                  fontSize: "1.1rem",
                  backgroundColor:
                    currentClass === course.course_name ? "#f0f0f0" : "transparent",
                }}
              >
                {course.course_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="chat-room">
        <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
            <h1 style={{ whiteSpace: "nowrap" }}>{currentClass ? `${currentClass} Chat` : "Select a Class"}</h1>
            <SearchIcon onClick={()=> navigate('/search')} 
                        style={{fontSize: "1.75rem", marginLeft: "auto", marginTop: "0.625rem", cursor: "pointer"}}/>
            <LogoutIcon onClick={() => { doSignOut().then(() => { navigate('/login') }) }} style={{fontSize: "1.75rem", marginLeft: "0.625rem", marginTop: "8px", cursor: "pointer"}}/>
            <Avatar onClick={()=> navigate('/profile')} alt={currentUser.displayName} src="/static/images/avatar/1.jpg"
                    style={{marginLeft: "10px", marginTop: "5px", cursor: "pointer"}}/>
        </div>
        {currentClass && (
          <div className="chat-box">
            <div className="messages">
              {chatlog?.map((msg, index) => (
                  <div key={`$${index}-${msg.sent_msg}`}>
                      <div
                          style={msg.sent_uid === currentUser.uid ?
                              {flexDirection: "row"} :
                              {flexDirection: "row-reverse"}}
                          className={"messages-div"}
                      >
                          <div style={
                              msg.sent_uid === currentUser.uid ?
                                  {marginLeft: "auto"} :
                                  {marginRight: "auto"}
                          }>
                              <p className={"text-xs text-gray-600"}>{msg?.sent_name}</p>
                              <div className="message" style={
                                  msg.sent_uid === currentUser.uid ?
                                      {marginLeft: "auto"} :
                                      {marginRight: "auto"}
                              } >
                                  {msg.sent_msg}
                              </div>
                          </div>

                          <Avatar
                              alt={msg.sent_name}
                              src="/static/images/avatar/1.jpg"
                              style={{marginLeft: "10px", marginRight: "10px"}}
                          />
                          <AlwaysScrollToBottom/>
                      </div>
                  </div>
              ))}
            </div>

              <form onSubmit={handleSendMessage} className="message-form">
                  <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message"
                      style={{
                          width: "100%",
                          padding: "10px",
                          fontSize: "16px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                          marginRight: "10px",
                      }}
                  />
                  <button type="submit" className="send-button">
                      Send
                  </button>
              </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
