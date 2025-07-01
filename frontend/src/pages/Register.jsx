import React, { useState, useEffect } from 'react';
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import { registerUser, searchUsers } from "../api.js";
import { IonIcon } from '@ionic/react';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [showError, setShowError] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const checkUsername = async () => {
            if (username.length >= 3 && !usernameError) {
                try {
                    const response = await searchUsers(username);
                    const isTaken = response.some(user => user.username.toLowerCase() === username.toLowerCase());
                    setUsernameAvailable(!isTaken);
                } catch (err) {
                    setUsernameAvailable(null);
                }
            } else {
                setUsernameAvailable(null);
            }
        };

        const timer = setTimeout(() => {
            checkUsername();
        }, 500);

        return () => clearTimeout(timer);
    }, [username, usernameError]);
    useEffect(() => {
        if (error) {
            setShowError(true);
            const timer = setTimeout(() => {
                setShowError(false);
                setError('');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [error]);
    const handleUsernameChange = (e) => {
        const value = e.target.value.toLowerCase();
        setUsername(value);

        setUsernameAvailable(null);

        if (/\s/.test(value)) {
            setUsernameError('Spaces are not allowed');
        } else if (/[A-Z]/.test(value)) {
            setUsernameError('Use lowercase only');
        } else if (value.length < 3 && value.length > 0) {
            setUsernameError('At least 3 characters');
        } else if (value.length > 20) {
            setUsernameError('Max 20 characters');
        } else {
            setUsernameError('');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            if (usernameError) {
                setError(usernameError);
                return;
            }
            if (usernameAvailable === false) {
                setError('Username already taken');
                return;
            }
            const response = await registerUser({ username, email, password });
            console.log(response.data);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="hero-bg w-screen h-screen overflow-hidden">
            <NavBar />
            <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <img
                        className="mx-auto my-6 sm:my-0 md:my-0 lg:my-0 h-10 w-auto"
                        src="https://www.svgrepo.com/show/301692/login.svg"
                        alt="Workflow"
                    />
                    <h2 className="mt-6 text-center text-3xl leading-9 font-extrabold text-white">
                        Create a new account
                    </h2>
                    <p className="mt-2 text-center text-sm leading-5 text-gray-500 max-w">
                        Or &nbsp;
                        <a href="/login"
                            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition ease-in-out duration-150">
                            login to your account
                        </a>
                    </p>
                </div>

                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className=" py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        {error && (
                            <div className="mb-4 text-center text-red-500 font-bold">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleRegister}>
                            <div className="mt-6">
                                <label htmlFor="username" className="block text-sm font-medium leading-5 text-white">Username</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        id="username"
                                        value={username}
                                        onChange={handleUsernameChange}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ') {
                                                e.preventDefault();
                                                setUsernameError('Spaces are not allowed');
                                            }
                                        }}
                                        name="username"
                                        placeholder="e.g. coolplayer123"
                                        type="text"
                                        required
                                        className="flex-1 text-black border border-gray-300 form-input pl-3 block w-full rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 h-10 pr-10"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        {usernameError ? (
                                            <IonIcon icon={closeOutline} className="h-5 w-5 text-red-500" />
                                        ) : username && !usernameError && usernameAvailable === true ? (
                                            <IonIcon icon={checkmarkOutline} className="h-5 w-5 text-green-500" />
                                        ) : username && !usernameError && usernameAvailable === false ? (
                                            <IonIcon icon={closeOutline} className="h-5 w-5 text-red-500" />
                                        ) : null}
                                    </div>
                                </div>
                                <div className={`transition-opacity duration-300 ${showError ? 'opacity-100' : 'opacity-0'}`}>
                                    {error && (
                                        <p className="mt-1 text-sm text-red-500">{error}</p>
                                    )}
                                </div>
                                {username && !usernameError && usernameAvailable === false && (
                                    <p className="mt-1 text-sm text-red-500">Username already taken</p>
                                )}
                                {!usernameError && (
                                    <p className="mt-1 text-sm text-gray-400">
                                        {usernameAvailable === true ?
                                            'Username available!' :
                                            '3-20 lowercase letters, no spaces'}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6">
                                <label htmlFor="email" className="block text-sm font-medium leading-5 text-white">
                                    Email address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input id="email" value={email}
                                        onChange={(e) => setEmail(e.target.value)} name="email" placeholder="user@example.com" type="email"
                                        required=""
                                        className="text-black appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label htmlFor="password" className="block text-sm font-medium leading-5 text-white">
                                    Password
                                </label>
                                <div className="mt-1 rounded-md shadow-sm">
                                    <input id="password" value={password}
                                        onChange={(e) => setPassword(e.target.value)} name="password" type="password" required=""
                                        className="text-black appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label htmlFor="password_confirmation" className="block text-sm font-medium leading-5 text-white">
                                    Confirm Password
                                </label>
                                <div className="mt-1 rounded-md shadow-sm">
                                    <input id="password_confirmation" name="password_confirmation" type="password" required=""
                                        className="text-black appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" />
                                </div>
                            </div>

                            <div className="mt-6">
                                <span className="block w-full rounded-md shadow-sm">
                                    <button type="submit"
                                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition duration-150 ease-in-out">
                                        Create account
                                    </button>
                                </span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}