"use client"

import { supabase } from "@/lib/supabase"
import { div } from "framer-motion/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"
export default function Signup (){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    async function handleSignup() {
        const {error} = await supabase.auth.signUp({
        email,
        password,
    })
    if(error)alert(error.message)
    else alert("check your email")
    }

    const router = useRouter()

    useEffect(() => {
        async function checkUser() {
            const { data } = await supabase.auth.getUser()

            if(data.user){
                router.push("/")
            }
        }
        checkUser()
    }, [])

    // return(
    //     <div>
    //         <h1>Signup</h1>
    //         <input  
    //             placeholder="Email"
    //             onChange={(e) => setEmail(e.target.value)}
    //             className="border p-2 block mb-2"    
    //         />

    //         <input  
    //             placeholder="Password"
    //             type="password"
    //             onChange={(e) => setPassword(e.target.value)}
    //             className="border p-2 block mb-2"
    //         />
    //         <button onClick={handleSignup} className="bg-blue-500 text-white p-2">
    //             Sign up
    //         </button>
    //     </div>
    // )
    return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white-100 via-purple-900 to-white-100 text-white relative overflow-hidden">

    {/* Glow Effect */}
    <div className="absolute w-[400px] h-[400px] bg-purple-500/20 blur-3xl rounded-full"></div>

    {/* Glass Card */}
    <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl z-10">

      {/* Heading */}
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
        Create Account
      </h1>

      {/* Inputs */}
      <div className="flex flex-col gap-4">

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-purple-500 transition placeholder:text-gray-400"
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-purple-500 transition placeholder:text-gray-400"
        />

        {/* Button */}
        <button
          onClick={handleSignup}
          className="mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:scale-105 active:scale-95 transition font-semibold shadow-lg"
        >
          Sign Up
        </button>

        {/* Redirect */}
        <p className="text-sm text-gray-400 text-center mt-2">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-pink-400 hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  </div>
);


}

