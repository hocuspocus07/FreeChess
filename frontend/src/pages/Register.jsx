import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api.js";
import { useState } from "react";
export default function Register() {
    const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleRegister = async (e) => {
      e.preventDefault();
      try {
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
            <form onSubmit={handleRegister}>
                

                <div className="mt-6">
                    <label htmlFor="username" className="block text-sm font-medium leading-5 text-white">Username</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input id="username" value={username}
        onChange={(e) => setUsername(e.target.value)} name="username" placeholder="john" type="text" required=""
                            className="flex-1  border border-gray-300 form-input pl-3 block w-full rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 h-10"/>
                    </div>
                </div>

                <div className="mt-6">
                    <label htmlFor="email" className="block text-sm font-medium leading-5 text-white">
                        Email address
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <input id="email" value={email}
        onChange={(e) => setEmail(e.target.value)} name="email" placeholder="user@example.com" type="email"
                            required=""
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"/>
                    </div>
                </div>

                <div className="mt-6">
                    <label htmlFor="password" className="block text-sm font-medium leading-5 text-white">
                        Password
                    </label>
                    <div className="mt-1 rounded-md shadow-sm">
                        <input id="password" value={password}
        onChange={(e) => setPassword(e.target.value)} name="password" type="password" required=""
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"/>
                    </div>
                </div>

                <div className="mt-6">
                    <label htmlFor="password_confirmation" className="block text-sm font-medium leading-5 text-white">
                        Confirm Password
                    </label>
                    <div className="mt-1 rounded-md shadow-sm">
                        <input id="password_confirmation" name="password_confirmation" type="password" required=""
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"/>
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
  