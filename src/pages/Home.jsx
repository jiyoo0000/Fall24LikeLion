import React from "react";
import { useState, useCallback, useEffect } from "react";
import {useNavigate} from 'react-router-dom';
import "../styles/Home.css";
import { Avatar } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/authContext';
import { doSignOut } from '../firebase/auth'
import useWebSocket, { ReadyState } from 'react-use-websocket';
import axios from 'axios';

// TODO intial key handle for the list of class is null

const Home = () => {
  const { currentUser } = useAuth();
  // initial socket url
  const [socketUrl, setSocketUrl] = useState('ws://localhost:3001');
  // state to store the message history
  const [messageHistory, setMessageHistory] = useState([]);

  // state to store the message to be sent
  const [message, setMessage] = useState('');
  const [classes, setClasses] = useState([]); // State for enrolled classes
  const [currentClass, setCurrentClass] = useState(null);
  const [currentClassId, setCurrentClassId] = useState(null);

  // user checklist
  const [enrolledUsers, setEnrolledUsers] = useState([]);


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
          setMessageHistory((prev) => prev.concat(JSON.parse(lastMessage.data)));
          console.log(lastMessage);
      }
  }, [lastMessage]);

  // function to open the socket connection to the echo route
  const handleClickSetSocketUrl = useCallback(
    () => setSocketUrl('ws://localhost:3001/echo'),
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
        const response = await axios.get('http://localhost:3001/course/enrolled', {
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

    fetchEnrolledCourses();
  }, [currentUser]);

  //fectch enrolled user 
  useEffect(() => {
    const fetchEnrolledUsers = async () => {
      if (!currentClassId) return; // 코스 ID가 없으면 실행하지 않음
  
      try {
        const response = await axios.get(`http://localhost:3001/course/${currentClassId}/users`, {
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.status === 200) {
          console.log("Fetched users:", response.data);
          setEnrolledUsers(response.data); // 사용자 목록을 상태에 저장
        } else if (response.status === 204) {
          console.log("No users found for this course");
          setEnrolledUsers([]); // 사용자가 없는 경우 빈 배열 설정
        }
  
      } catch (error) {
        console.error("Error fetching enrolled users:", error);
      }
    };  
  
    fetchEnrolledUsers();
  }, [currentClassId]); // `currentClassId`가 변경될 때마다 실행



  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const handleClassSelect = (course_name, course_id) => {
    setCurrentClass(course_name);
    setCurrentClassId(course_id);
    console.log('handle:', currentClassId)
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
  
      // Send message through WebSocket
      sendJsonMessage({
        message: input,
        course: currentClassId,
      });
  
      // Clear the input field
      setInput("");
    }
  };
  


  // useEffect to update the message history when a new message is received
  useEffect(() => {
      if (lastMessage !== null) {
          setMessageHistory((prev) => prev.concat(lastMessage));
      }
  }, [lastMessage]);

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
                  fontSize: "20px",
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
        <div style={{display: "flex", flexDirection: "row"}}>
            <h1 style={{ whiteSpace: "nowrap" }}>{currentClass ? `${currentClass} Chat` : "Select a Class"}</h1>
            <SearchIcon onClick={()=> navigate('/search')} 
                        style={{fontSize: "40px", marginLeft: "800px", marginTop: "5px", cursor: "pointer"}}/>
            <LogoutIcon onClick={() => { doSignOut().then(() => { navigate('/login') }) }} style={{fontSize: "35px", marginLeft: "10px", marginTop: "8px", cursor: "pointer"}}/>
            <Avatar onClick={()=> navigate('/profile')} alt="Remy Sharp" src="/static/images/avatar/1.jpg" 
                    style={{marginLeft: "10px", marginTop: "5px", cursor: "pointer"}}/>
        </div>
        {currentClass && (
          <div className="chat-box">
            <div className="messages">
              {messages[currentClass]?.map((msg, index) => (
                <div
                  key={`${currentClass}-${index}-${msg}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "10px",
                  }}
                >
                  <div className="message">
                    {msg}
                  </div>
                  <Avatar
                    alt="Remy Sharp"
                    src="/static/images/avatar/1.jpg"
                    style={{ marginLeft: "10px" }}
                  />
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
      {currentClass && (
      <div className="user-list">
    <h3>Enrolled Users</h3>
    <ul>
      {enrolledUsers.map((user) => (
        <li key={user.id} style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
          <Avatar alt={user.name} src={user.avatarUrl} style={{ marginRight: "10px" }} />
          {user.name}
        </li>
      ))}
    </ul>
  </div>
)}
    </div>
  );
};




export default Home;
