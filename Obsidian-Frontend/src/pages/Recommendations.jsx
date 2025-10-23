import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import AnimatedCard from '../components/reactbits/AnimatedCard';

export default function Recommendations() {
  const [selectedService, setSelectedService] = useState(null);

  // Fetch system recommendations
  const { data: systemRecommendations = [], isLoading: systemLoading } = useQuery({
    queryKey: ['systemRecommendations'],
    queryFn: async () => {
      const response = await api.get('/recommendations');
      return response.data;
    },
  });

  // Fetch quick wins
  const { data: quickWins = [], isLoading: quickWinsLoading } = useQuery({
    queryKey: ['quickWins'],
    queryFn: async () => {
      const response = await api.get('/recommendations/quick-wins/list');
      return response.data;
    },
  });

  // Fetch service-specific recommendations
  const { data: serviceRecommendations = [] } = useQuery({
    queryKey: ['serviceRecommendations', selectedService],
    queryFn: async () => {
      if (!selectedService) return [];
      const response = await api.get(`/recommendations/${selectedService}`);
      return response.data;
    },
    enabled: !!selectedService,
  });

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: <AlertTriangle className="w-5 h-5 text-red-400" />,
      warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      info: <Lightbulb className="w-5 h-5 text-blue-400" />,
    };
    return icons[severity] || icons.info;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'border-red-500/50 bg-red-500/10',
      warning: 'border-yellow-500/50 bg-yellow-500/10',
      info: 'border-blue-500/50 bg-blue-500/10',
    };
    return colors[severity] || colors.info;
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-merriweather font-bold gradient-text flex items-center gap-3">
          <Lightbulb className="w-10 h-10" />
          AI Recommendations
        </h1>
        <p className="mt-3 text-gray-400 font-inter text-lg">
          AI-powered insights to improve your system's resilience and performance
        </p>
      </motion.div>

      {/* Quick Wins Section */}
      <Card className="overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            <h2 className="text-2xl font-merriweather font-bold text-white">⚡ Quick Wins</h2>
          </div>
          <p className="mt-3 text-gray-400 font-inter">
            Easy improvements with high impact - implement these first for maximum results!
          </p>
        </div>
        <div className="p-8">
          {quickWinsLoading ? (
            <div className="text-center py-12 text-gray-400 font-inter">
              <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
              Analyzing quick wins...
            </div>
          ) : quickWins.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <p className="text-white font-semibold text-lg font-inter mb-2">
                Great job! No quick wins needed.
              </p>
              <p className="text-gray-400 font-inter">
                Your system is well optimized.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickWins.map((win, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-2 border-green-500/30 rounded-xl p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all bg-gray-900/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <Badge variant="success" className="text-xs font-inter">
                        {win.impact.toUpperCase()} IMPACT
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-xs font-inter">
                      {win.effort.toUpperCase()} EFFORT
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-xl text-white font-inter mb-3">{win.title}</h3>
                  <p className="text-sm text-gray-400 font-inter mb-4">{win.description}</p>
                  {win.serviceName && (
                    <div className="text-xs text-gray-500 font-mono mb-3 px-3 py-1 bg-gray-800 rounded">
                      Service: {win.serviceName}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-green-400 font-semibold font-inter">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {win.estimatedImprovement}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* System-Wide Recommendations */}
      <Card className="p-8">
        <div className="pb-6 mb-6 border-b border-gray-800">
          <h2 className="text-2xl font-merriweather font-bold text-white">System-Wide Recommendations</h2>
        </div>
        <div>
          {systemLoading ? (
            <div className="text-center py-12 text-gray-400 font-inter">
              <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
              Analyzing system...
            </div>
          ) : systemRecommendations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <p className="text-white font-semibold text-lg font-inter mb-2">System looks healthy!</p>
              <p className="text-gray-400 font-inter">
                No critical issues detected.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {systemRecommendations.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} delay={index * 0.1} />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Service-Specific Recommendations */}
      {selectedService && serviceRecommendations.length > 0 && (
        <Card className="p-8">
          <div className="pb-6 mb-6 border-b border-gray-800">
            <h2 className="text-2xl font-merriweather font-bold text-white">
              Recommendations for {selectedService}
            </h2>
          </div>
          <div className="space-y-6">
            {serviceRecommendations.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} delay={index * 0.1} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Recommendation Card Component
function RecommendationCard({ recommendation, delay = 0 }) {
  const getSeverityIcon = (severity) => {
    const icons = {
      critical: <AlertTriangle className="w-6 h-6 text-red-400" />,
      warning: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
      info: <Lightbulb className="w-6 h-6 text-blue-400" />,
    };
    return icons[severity] || icons.info;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'border-red-500/50 bg-red-500/10',
      warning: 'border-yellow-500/50 bg-yellow-500/10',
      info: 'border-blue-500/50 bg-blue-500/10',
    };
    return colors[severity] || colors.info;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`border-l-4 rounded-xl p-6 ${getSeverityColor(
        recommendation.severity
      )}`}
    >
      <div className="flex items-start gap-5">
        <div className="flex-shrink-0 mt-1">
          {getSeverityIcon(recommendation.severity)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-semibold text-xl text-white font-inter">{recommendation.title}</h3>
            <Badge
              variant={
                recommendation.severity === 'critical'
                  ? 'error'
                  : recommendation.severity === 'warning'
                  ? 'warning'
                  : 'info'
              }
            >
              {recommendation.type}
            </Badge>
          </div>

          <p className="text-gray-300 font-inter mb-4">{recommendation.description}</p>

          <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
            <div className="text-sm font-semibold text-gray-300 mb-2 font-inter flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Suggestion:
            </div>
            <p className="text-sm text-gray-400 font-inter">{recommendation.suggestion}</p>
          </div>

          {recommendation.actions && recommendation.actions.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-300 mb-3 font-inter">
                Recommended Actions:
              </div>
              <ul className="space-y-2">
                {recommendation.actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-300 font-inter">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
