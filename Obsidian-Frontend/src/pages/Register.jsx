import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import MagneticButton from '../components/reactbits/MagneticButton';
import ElectricBorder from '../components/reactbits/ElectricBorder';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        organization: formData.organization,
      });

      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate('/app/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 sm:p-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid opacity-10"></div>
      <div className="fixed inset-0 bg-dots opacity-5"></div>
      
      {/* Floating Orbs */}
      <motion.div 
        className="absolute top-20 right-20 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl"
        animate={{
          y: [0, 60, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 left-20 w-72 h-72 bg-pink-500/30 rounded-full blur-3xl"
        animate={{
          y: [0, -40, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      />

      {/* Register Card */}
      <motion.div 
        className="relative z-10 w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ElectricBorder
          color="#FF9FFC"
          speed={1}
          chaos={0.5}
          thickness={2}
          style={{ borderRadius: 24 }}
        >
          <div className="glass-dark rounded-3xl p-8 sm:p-10 lg:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div 
                className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 mb-6 animate-pulse-glow"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <span className="text-5xl">✨</span>
              </motion.div>
              
              <h1 className="text-4xl font-merriweather font-black gradient-text mb-3">
                Join Obsidian
              </h1>
              <p className="text-gray-400 font-inter text-base">
                Create your account and start monitoring
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

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white font-inter transition-all placeholder:text-gray-500"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white font-inter transition-all placeholder:text-gray-500"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
                  Organization <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white font-inter transition-all placeholder:text-gray-500"
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData({ ...formData, organization: e.target.value })
                  }
                  placeholder="Your Company"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white font-inter transition-all placeholder:text-gray-500"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-2 font-inter">
                  Minimum 6 characters required
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white font-inter transition-all placeholder:text-gray-500"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <MagneticButton
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-lg font-semibold font-inter bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  {loading ? '⏳ Creating Account...' : '✨ Create Account'}
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
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link to="/login">
                <button className="w-full px-5 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-semibold font-inter hover:bg-gray-800 hover:border-gray-600 transition-all">
                  Sign In Instead
                </button>
              </Link>
            </div>

            {/* Terms */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <p className="text-xs text-center text-gray-600 font-inter leading-relaxed">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300">
                  Privacy Policy
                </a>
              </p>
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
        </div>
      </motion.div>
    </div>
  );
}
