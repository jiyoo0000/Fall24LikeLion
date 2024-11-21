import React from "react";
import { useState, useEffect } from "react";
import {useNavigate} from 'react-router-dom';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { useAuth } from '../contexts/authContext';
import "../styles/Profile.css";
import axios from 'axios';

const Profile = () => {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL.replace(/^wss:/, 'https:'); //process.env.REACT_APP_BACKEND_URL;
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [classes, setClasses] = useState([]); // State for enrolled classes

    const handleSave = async () => {
        try {
            const response = await axios.put(`${BACKEND_URL}/auth/name`, {
                headers: { 'Content-Type': 'application/json' },
                params: {uid: currentUser.uid, name: name}
            })

            if (response.status === 200) {
                alert(`Profile Updated!\nName: ${name}`);
            }
        } catch (error) {
            alert('An error occurred while changing name');
        }
    };

    const dropCourse = async (courseId) => {
        try {
            const response = await axios.delete(`${BACKEND_URL}/course`, {
                headers: { 'Content-Type': 'application/json' },
                params: {uid: currentUser.uid, courseId: courseId}
            });

            if (response.status === 200) {
                alert("Course deleted successfully!");
                setClasses(classes.filter(course => course._id !== courseId)); // Update UI
            }
        } catch (error) {
            console.error("Error deleting a course:", error);
            alert("An error occurred while deleting the course.");
        };
    };

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
    
        fetchEnrolledCourses();
      }, [currentUser]);
    

    return (
        <div className="settings-container">
            <div style={{display:"flex"}}>
            <KeyboardBackspaceIcon onClick={()=> navigate('/')}
                                    style={{fontSize: "40px", cursor: "pointer"}}/>
            <h2>Profile</h2>
            </div>
            <div className="change-profile">
            <div className="name-section">
                <h2>Name</h2>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="name-input"
                />
            </div>
            <div className="password-section">
                <h2>Password</h2>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="password-input"
                />
            </div>
            <button onClick={handleSave} className="save-button">Save</button>
            </div>
            
            <h2>Classes</h2>
            <div className="class-list1">
                {classes.map((course) => (
                    <div key={course._id} className="class-item">
                        <div className="class-info">
                            <h3>{course.course_name}</h3>
                            <p>NA</p>
                        </div>
                        <button
                            className="delete-button"
                            onClick={() => dropCourse(course._id)}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Profile;