import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LiquidEther from '../components/reactbits/LiquidEther';
import ElectricBorder from '../components/reactbits/ElectricBorder';
import MagneticButton from '../components/reactbits/MagneticButton';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Circuit Breakers',
      description: 'Automatic fault isolation prevents cascading failures across your services',
      icon: '🛡️',
      color: '#7df9ff',
    },
    {
      title: 'Real-time Monitoring',
      description: 'Track metrics, logs, and events with live updates and intelligent alerts',
      icon: '📊',
      color: '#ff7dff',
    },
    {
      title: 'Chaos Engineering',
      description: 'Test resilience with built-in failure simulation and recovery testing',
      icon: '💣',
      color: '#7dffb5',
    },
    {
      title: 'GitHub Integration',
      description: 'Automatically fetch README, stars, and repository metadata',
      icon: '📖',
      color: '#ffd77d',
    },
    {
      title: 'Global Monitoring',
      description: 'Monitor microservices anywhere - local or production endpoints',
      icon: '🌐',
      color: '#ff7d7d',
    },
    {
      title: 'AI Recommendations',
      description: 'Get intelligent suggestions to improve your system resilience',
      icon: '🤖',
      color: '#b19eef',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden">
      {/* Liquid Ether Background */}
      <div className="fixed inset-0 z-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-8xl md:text-9xl font-merriweather font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Obsidian
              </h1>
              <p className="text-3xl md:text-5xl font-merriweather font-bold text-white mb-4">
                MROP
              </p>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 font-inter max-w-3xl mx-auto">
                Microservice Resilience & Observability Platform
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <MagneticButton
                onClick={() => navigate('/dashboard')}
                className="text-lg px-8 py-4"
              >
                🚀 Get Started
              </MagneticButton>
              <MagneticButton
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800"
              >
                🔐 Login
              </MagneticButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 font-inter"
            >
              <span>✨ Circuit Breakers</span>
              <span>•</span>
              <span>📊 Real-time Monitoring</span>
              <span>•</span>
              <span>🔧 Chaos Engineering</span>
              <span>•</span>
              <span>🌐 Global URL Support</span>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-merriweather font-black text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 font-inter">
              Everything you need to build resilient microservices
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ElectricBorder
                  color={feature.color}
                  speed={1}
                  chaos={0.5}
                  thickness={2}
                  style={{ borderRadius: 16 }}
                  className="h-full"
                >
                  <div className="glass-dark p-8 rounded-2xl h-full">
                    <div className="text-6xl mb-4">{feature.icon}</div>
                    <h3 className="text-2xl font-merriweather font-bold text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 font-inter">
                      {feature.description}
                    </p>
                  </div>
                </ElectricBorder>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <ElectricBorder
              color="#5227FF"
              speed={1.5}
              chaos={0.8}
              thickness={3}
              style={{ borderRadius: 24 }}
            >
              <div className="glass-dark p-16 rounded-3xl">
                <h2 className="text-5xl font-merriweather font-black text-white mb-6">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-gray-300 mb-8 font-inter">
                  Build resilient, observable microservices today
                </p>
                <MagneticButton
                  onClick={() => navigate('/register')}
                  className="text-xl px-12 py-5"
                >
                  Create Account →
                </MagneticButton>
              </div>
            </ElectricBorder>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center text-gray-500 font-inter text-sm">
              <p>© 2025 Obsidian MROP. Built with ❤️ for microservice developers.</p>
              <div className="mt-4 space-x-4">
                <span>MERN Stack</span>
                <span>•</span>
                <span>Kafka</span>
                <span>•</span>
                <span>Circuit Breakers</span>
                <span>•</span>
                <span>Real-time Observability</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

