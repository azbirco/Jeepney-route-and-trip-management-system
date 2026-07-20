import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from "framer-motion";/*  */
import {
  Bus,
  Key,
  User,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

const Login = () => {
  const {
    login,
    error,
    setError
  } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  setLoading(true);

  console.time("LOGIN");

  const res = await login(
    form.username,
    form.password
  );

  console.timeEnd("LOGIN");

  console.log("Login Result:", res);

  if (res.success) {
    navigate("/");
  }

  setLoading(false);
};

  return (

<div className="min-h-screen w-full bg-[#09090B] flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">

      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#F97316]/5 blur-[120px]" />

      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-[#F97316]/3 blur-[140px]" />

      <div className="w-full max-w-[440px] z-10">

        <div className="flex flex-col items-center text-center mb-8">

          <motion.div
            initial={{
              scale: 0.8,
              opacity: 0
            }}
            animate={{
              scale: 1,
              opacity: 1
            }}
            transition={{
              duration: 0.5,
              type: 'spring'
            }}
            className="flex items-center justify-center p-3 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20 mb-4"
          >

            <Bus className="w-8 h-8 text-[#F97316]" />

          </motion.div>

          <motion.h1
            initial={{
              y: -10,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            className="font-display font-black text-3xl text-white"
          >

            RouteOps
            <span className="text-[#F97316]">
              .NV
            </span>
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            className="text-xs text-[#A1A1AA] uppercase mt-2 font-mono"
          >

            Jeepney Route and Trip Management System

          </motion.p>

        </div>

        <motion.div

          initial={{
            y: 20,
            opacity: 0
          }}

          animate={{
            y: 0,
            opacity: 1
          }}

          className="bg-[#18181B]/70 border border-[#27272A] p-6 sm:p-8 rounded-2xl backdrop-blur-md shadow-2xl"

        >

          <div className="border-b border-[#27272A] pb-4 mb-6">

           <h2 className="text-lg font-bold text-white text-center">
            Log in to your account
            </h2>

          </div>

          <AnimatePresence>

            {error && (

              <motion.div

                initial={{
                  opacity: 0,
                  height: 0
                }}

                animate={{
                  opacity: 1,
                  height: 'auto'
                }}

                exit={{
                  opacity: 0,
                  height: 0
                }}

              >

                <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-4">

                  <AlertCircle
                    className="w-4 h-4"
                  />

                  <span>

                    {error}

                  </span>

                </div>

              </motion.div>

            )}

          </AnimatePresence>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <div>

              <label className="text-xs text-[#A1A1AA] uppercase font-mono">

                Username or Email

              </label>

              <div className="relative mt-1">

                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />

                <input

                  type="text"

                  name="username"

                  value={form.username}

                  onChange={handleInputChange}

                  placeholder="admin"

                  required

                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#09090B] border border-[#27272A] text-white outline-none focus:border-[#F97316]"

                />

              </div>

            </div>

            <div>

              <label className="text-xs text-[#A1A1AA] uppercase font-mono">

                Password

              </label>

              <div className="relative mt-1">

                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />

                <input

                  type={showPassword ? "text" : "password"}

                  name="password"

                  value={form.password}

                  onChange={handleInputChange}

                  placeholder="••••••••"

                  required

                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-[#09090B] border border-[#27272A] text-white outline-none focus:border-[#F97316]"

                />

                <button

                  type="button"

                  onClick={() => setShowPassword((prev) => !prev)}

                  tabIndex={-1}

                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white transition"

                >

                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}

                </button>

              </div>

            </div>

            <button

              type="submit"

              disabled={loading}

              className="w-full py-3 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"

            >

              {loading ? (

                <>

                  <RefreshCw className="w-4 h-4 animate-spin" />

                  Processing...

                </>

              ) : (

                'Login'

              )}

            </button>

          </form>

        </motion.div>

        <p className="text-center text-[10px] text-[#A1A1AA]/50 mt-6 font-mono">

          RouteOps.NV • Plan Routes. Manage Trips. Monitor Operations.

        </p>

      </div>

    </div>

  );

};

export default Login;