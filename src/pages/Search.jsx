import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom';
import { TextField, List, ListItem, Box, Typography } from '@mui/material';
import axios from 'axios';
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { useAuth } from '../contexts/authContext';

const Search = () => {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL.replace(/^wss:/, 'https:'); //process.env.REACT_APP_BACKEND_URL;
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const navigate = useNavigate();
    const handleChange = async (event) => {
        const inputValue = event.target.value;
        setSearchTerm(inputValue);

        if (inputValue.trim() !== '') {
            const response = await axios.get(`${BACKEND_URL}/course`, {
                headers: { 'Content-Type': 'application/json' },
                params: { course: inputValue },
            });

            if (response.data) {
                setSearchResults(response.data);
            }
        } else {
            setSearchResults([]); // Clear results if input is empty
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            // Make a PUT request to enroll the user in the course
            const response = await axios.put(
                `${BACKEND_URL}/course/enroll`,
                {
                    headers: { 'Content-Type': 'application/json' },
                    params: { uid: currentUser.uid, courseId: courseId },
                }
            );
        
            if (response.status === 200) {
                alert('User successfully enrolled in the course!');
            }
        } catch (error) {
            console.error('Error enrolling user:', error.response?.data || error.message);
            alert(
                error.response?.data || 'An error occurred while trying to enroll in the course.'
            );
        }
    };
    

    return (
        <>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center" // Centers vertically
            >
                <KeyboardBackspaceIcon onClick={()=> navigate('/')}
                                       style={{fontSize: "50px", cursor: "pointer"}}
                                       className={"sticky z-50 top-0 self-start"}
                />
                {/* Centered search input */}
                <Box width="500px" marginBottom="20px" marginTop="35vh" className={"sticky top-0" +
                    " z-40"} sx={{ backgroundColor: '#f4f4f4' }}> {/* Box to control width and spacing */}
                    {/* Label above the search bar */}
                    <Typography variant="h6" gutterBottom className={"sticky top-0"}>
                        Enter your UCSD Class Name!
                    </Typography>

                    <TextField
                        label="Search"
                        variant="outlined"
                        fullWidth
                        value={searchTerm}
                        onChange={handleChange}
                        placeholder="Type to search..."
                    />
                </Box>
                <Box className={"sticky top-0"}>
                    {/* Conditionally render the list only if searchTerm is not empty */}
                    {searchTerm.trim() !== '' && (
                        <List style={{ width: '500px' }}> {/* Keep the list aligned with the search box */}
                            {searchResults.length > 0 ? (
                                searchResults.map((item) => (
                                    <ListItem 
                                        key={item._id}
                                        onClick={() => handleEnroll(item._id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {item.course_name}
                                    </ListItem>
                                ))
                            ) : (
                                <ListItem>No results found</ListItem>
                            )}
                        </List>
                    )}
                </Box>


            </Box>
        </>
    );
};

export default Search;