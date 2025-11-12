import { useEffect, useState, useCallback, type KeyboardEvent } from "react"
import { Link, useNavigate } from "react-router-dom";
import { register } from "../utils/authService";
export default function Register() {

  // Redirect if already logged in
  const navigate = useNavigate();
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{
    type: "success" | "error" | "idle",
    message: string
  }>({ type: "idle", message: "" })

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
  
    try {
      setIsLoading(true)
      setStatus({ type: "idle", message: "" })
      await register(name, phone, password)  // ترتيب صحيح: name, phone, password
      setStatus({ type: "success", message: "Register successful! Redirecting..." })
      setTimeout(() => {
        navigate("/login")
      }, 1000)
    } catch (err) {
      setStatus({ type: "error", message: err.data })
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }, [name, phone, password, isLoading, navigate]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }, [handleSubmit]);

  return (
    <div className="w-full h-screen flex max-md:flex-col items-center justify-center py-5">
      <img src="https://cdni.iconscout.com/illustration/premium/thumb/chat-app-illustration-svg-png-download-7887809.png" 
           alt="background" 
           className="object-cover object-center h-screen w-7/12"/>
      <div className="bg-white flex flex-col justify-center items-center w-5/7 p-5 shadow-lg">
        <h1 className="text-3xl font-bold text-indigo-500 mb-2">Register</h1>
        <div className="w-1/2 text-center max-md:w-full">
          {status.type !== "idle" && (
            <div className={`mb-4 px-4 py-2 rounded ${
              status.type === "success" 
                ? "bg-green-100 text-green-700 border border-green-400"
                : "bg-red-100 text-red-700 border border-red-400"
            }`}>
              {status.message}
            </div>
          )}

                      <input 
            type="text" 
            name="name" 
            placeholder="Your Name" 
            onChange={e => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="shadow-md border w-full h-10 px-3 py-2 text-indigo-500 focus:outline-none focus:border-indigo-500 mb-3 rounded disabled:opacity-50"
          />

          <input 
            type="text" 
            name="mobile" 
            placeholder="Mobile" 
            onChange={e => setPhone(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="shadow-md border w-full h-10 px-3 py-2 text-indigo-500 focus:outline-none focus:border-indigo-500 mb-3 rounded disabled:opacity-50"
          />
          <input 
            type="password" 
            name="password" 
            placeholder="password" 
            onChange={e => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="shadow-md border w-full h-10 px-3 py-2 text-indigo-500 focus:outline-none focus:border-indigo-500 mb-3 rounded disabled:opacity-50"
          />
          <div className="p-2 text-start">
          <span>Do You already have an account?</span> <Link className="text-indigo-500" to="/login">Login</Link>

          </div>
          <button 
            className={`bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded text-lg focus:outline-none shadow disabled:opacity-50 flex items-center justify-center w-full`}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Register'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
