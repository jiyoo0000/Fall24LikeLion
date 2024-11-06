import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/authContext'; // Assuming this provides the signup function
import { doCreateUserWithEmailAndPassword } from '../../../firebase/auth'; // Firebase auth function
import axios from 'axios'; // For sending user data to backend

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const { userLoggedIn } = useAuth();

    const onSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // Clear previous errors

        // Validate passwords match
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        // Begin registration process
        if (!isRegistering) {
            setIsRegistering(true);
            try {
                // Create user with Firebase
                const userCredential = await doCreateUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Send UID and email to backend (if required)
                await axios.post('http://localhost:3001/auth/signup/', {
                    uid: user.uid,
                    email: user.email
                });

                // Navigate to home after successful signup
                navigate('/home');
            } catch (error) {
                setErrorMessage(error.message);
            } finally {
                setIsRegistering(false);
            }
        }
    };

    return (
        <>
            {userLoggedIn && <Navigate to={'/home'} replace={true} />} {/* Redirect if user already logged in */}

            <main className="w-full h-screen flex justify-center items-center">
                <div className="w-96 p-4 shadow-xl border rounded-xl">
                    <div className="text-center mb-6">
                        <h3 className="text-gray-800 text-xl font-semibold">Create a New Account</h3>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600 font-bold">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 font-bold">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isRegistering}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 font-bold">Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isRegistering}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent border rounded-lg"
                            />
                        </div>

                        {errorMessage && <span className="text-red-600 font-bold">{errorMessage}</span>}

                        <button
                            type="submit"
                            disabled={isRegistering}
                            className={`w-full px-4 py-2 text-white font-medium rounded-lg ${isRegistering ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {isRegistering ? 'Signing Up...' : 'Sign Up'}
                        </button>

                        <div className="text-sm text-center">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold hover:underline">Continue</Link>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};

export default Register;