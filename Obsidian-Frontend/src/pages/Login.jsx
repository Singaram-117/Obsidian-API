import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import MagneticButton from '../components/reactbits/MagneticButton';
import ElectricBorder from '../components/reactbits/ElectricBorder';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/app/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const credentials = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    // Basic validation
    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const result = await login(credentials);
      
      if (result.success) {
        navigate('/app/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-inter">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 sm:p-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid opacity-10"></div>
      <div className="fixed inset-0 bg-dots opacity-5"></div>
      
      {/* Floating Orbs */}
      <motion.div 
        className="absolute top-20 left-20 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl"
        animate={{
          y: [0, 50, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
        animate={{
          y: [0, -50, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* Login Card */}
      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ElectricBorder
          color="#5227FF"
          speed={1}
          chaos={0.5}
          thickness={2}
          style={{ borderRadius: 24 }}
        >
          <div className="glass-dark rounded-3xl p-8 sm:p-10 lg:p-12">
            {/* Logo */}
            <div className="text-center mb-10">
              <motion.div 
                className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 animate-pulse-glow"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <motion.span 
                  className="text-6xl"
                  animate={{
                    y: [-5, 5, -5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🌑
                </motion.span>
              </motion.div>
              
              <h1 className="text-4xl font-merriweather font-black gradient-text mb-3">
                Obsidian MROP
              </h1>
              <p className="text-gray-400 font-inter text-base">
                Microservice Resilience & Observability Platform
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm font-inter"
              >
                <span className="font-semibold">⚠️ Error:</span> {error}
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-inter transition-all placeholder:text-gray-500"
                  placeholder="admin@obsidian.dev"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-300 font-inter">
                    Password
                  </label>
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300 font-inter">
                    Forgot?
                  </a>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-inter transition-all placeholder:text-gray-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <MagneticButton
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-lg font-semibold font-inter"
                >
                  {loading ? '⏳ Signing in...' : '🚀 Sign In'}
                </MagneticButton>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-500 font-inter">
                  New to Obsidian?
                </span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-400 font-inter mb-4">
                Don't have an account yet?
              </p>
              <Link to="/register">
                <button className="w-full px-5 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-semibold font-inter hover:bg-gray-800 hover:border-gray-600 transition-all">
                  Create Account
                </button>
              </Link>
            </div>

            {/* Features */}
            <div className="mt-10 pt-8 border-t border-gray-800">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-2">🛡️</div>
                  <p className="text-xs text-gray-500 font-inter font-medium">
                    Circuit Breakers
                  </p>
                </div>
                <div>
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-xs text-gray-500 font-inter font-medium">
                    Monitoring
                  </p>
                </div>
                <div>
                  <div className="text-3xl mb-2">💣</div>
                  <p className="text-xs text-gray-500 font-inter font-medium">
                    Chaos Testing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ElectricBorder>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 font-inter">
            <Link to="/" className="hover:text-gray-400 transition-colors">
              ← Back to Home
            </Link>
            <span>•</span>
            <a href="#" className="hover:text-gray-400 transition-colors">
              Help
            </a>
            <span>•</span>
            <a href="#" className="hover:text-gray-400 transition-colors">
              Support
            </a>
          </div>
          <p className="text-xs text-gray-700 font-inter">
            Demo: admin@obsidian.dev / Admin@123
          </p>
        </div>
      </motion.div>
    </div>
  );
}