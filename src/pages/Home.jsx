import React from "react";
import { useState } from "react";
import {useNavigate} from 'react-router-dom';
import "../styles/Home.css";
import { Avatar } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/authContext';
import { doSignOut } from '../firebase/auth'

const Home = () => {
  const { currentUser } = useAuth();
  const classes = ["Class 1", "Class 2", "Class 3"]; // List of classes
  const [selectedClass, setSelectedClass] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const handleClassSelect = (className) => {
    setSelectedClass(className);
    if (!messages[className]) {
      setMessages((prev) => ({ ...prev, [className]: [] })); // Initialize messages for the selected class
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && selectedClass) {
      setMessages((prevMessages) => ({
        ...prevMessages,
        [selectedClass]: [...prevMessages[selectedClass], input],
      }));
      setInput("");
    }
  };

  return (
    <div className="container">
      <div className="class-list">
        <h3>Conversations</h3>
        <ul>
          {classes.map((className, index) => (
            <li
              key={index}
              onClick={() => handleClassSelect(className)}
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
                  selectedClass === className ? "#f0f0f0" : "transparent",
              }}
            >
              {className}
            </li>
          ))}
        </ul>
      </div>
      <div className="chat-room">
        <div style={{display: "flex", flexDirection: "row"}}>
            <h1 style={{ whiteSpace: "nowrap" }}>{selectedClass ? `${selectedClass} Chat` : "Select a Class"}</h1>
            <SearchIcon onClick={()=> navigate('/search')} 
                        style={{fontSize: "40px", marginLeft: "800px", marginTop: "5px", cursor: "pointer"}}/>
            <LogoutIcon onClick={() => { doSignOut().then(() => { navigate('/login') }) }} style={{fontSize: "35px", marginLeft: "10px", marginTop: "8px", cursor: "pointer"}}/>
            <Avatar onClick={()=> navigate('/profile')} alt="Remy Sharp" src="/static/images/avatar/1.jpg" 
                    style={{marginLeft: "10px", marginTop: "5px", cursor: "pointer"}}/>
        </div>
        {selectedClass && (
          <div className="chat-box">
            <div className="messages">
              {messages[selectedClass]?.map((msg, index) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "10px",
                  }}
                >
                  <div key={index} className="message">
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
            <form onSubmit={sendMessage} className="message-form">
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
