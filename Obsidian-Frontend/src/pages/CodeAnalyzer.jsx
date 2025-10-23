import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Search,
  Sparkles,
  GitBranch,
  FileCode,
  Folder,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Database,
  Layers,
} from 'lucide-react';
import { api } from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import MagneticButton from '../components/reactbits/MagneticButton';
import ElectricBorder from '../components/reactbits/ElectricBorder';
import AnimatedCard from '../components/reactbits/AnimatedCard';

export default function CodeAnalyzer() {
  const [githubUrl, setGithubUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);

  // Analyze repository mutation
  const analyzeMutation = useMutation({
    mutationFn: async (url) => {
      const response = await api.post('/code-analyzer/analyze', { githubUrl: url });
      return response.data;
    },
    onSuccess: (response) => {
      // Extract data from API response
      const analysisData = response?.data || response;
      setAnalysis(analysisData);
    },
  });

  const handleAnalyze = () => {
    if (githubUrl.trim()) {
      analyzeMutation.mutate(githubUrl.trim());
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Code2 className="w-12 h-12 text-purple-400" />
          </motion.div>
          <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
        </div>
        
        <h1 className="text-5xl font-merriweather font-black gradient-text mb-4">
          AI Code Analyzer
        </h1>
        <p className="text-xl text-gray-400 font-inter max-w-3xl mx-auto">
          Powered by HuggingFace AI - Read any GitHub repository and get instant insights,
          architecture analysis, and resilience recommendations
        </p>
      </motion.div>

      {/* Search Section */}
      <ElectricBorder
        color="#8B5CF6"
        speed={1}
        chaos={0.6}
        thickness={2}
        style={{ borderRadius: 24 }}
      >
        <Card className="p-10">
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-300 mb-4 font-inter">
                GitHub Repository URL
              </label>
              <div className="flex gap-4">
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="https://github.com/username/repository"
                  className="flex-1 px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white font-inter text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-500"
                  disabled={analyzeMutation.isPending}
                />
                <MagneticButton
                  onClick={handleAnalyze}
                  disabled={!githubUrl.trim() || analyzeMutation.isPending}
                  className="px-8 py-4 text-lg bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Analyze
                    </>
                  )}
                </MagneticButton>
              </div>
            </div>

            {/* Example URLs */}
            <div className="flex flex-wrap gap-3">
              <span className="text-sm text-gray-500 font-inter">Try:</span>
              {[
                'https://github.com/vercel/next.js',
                'https://github.com/facebook/react',
                'https://github.com/nodejs/node',
              ].map((url) => (
                <button
                  key={url}
                  onClick={() => setGithubUrl(url)}
                  className="text-sm px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-purple-400 hover:bg-gray-800 hover:border-purple-500 transition-all font-inter"
                >
                  {url.split('/').pop()}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </ElectricBorder>

      {/* Error Message */}
      <AnimatePresence>
        {analyzeMutation.isError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-6 bg-red-500/10 border-red-500/50">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <div>
                  <p className="text-red-300 font-semibold font-inter">Analysis Failed</p>
                  <p className="text-sm text-red-400 font-inter mt-1">
                    {analyzeMutation.error?.message || 'Could not analyze repository. Please check the URL and try again.'}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && analysis.repository && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Repository Info */}
            <Card className="p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <GitBranch className="w-8 h-8 text-purple-400" />
                    <h2 className="text-3xl font-merriweather font-bold text-white">
                      {analysis.repository?.repo || 'Repository'}
                    </h2>
                  </div>
                  <p className="text-gray-400 font-inter text-lg">
                    by <span className="text-purple-400 font-semibold">{analysis.repository?.owner || 'Unknown'}</span>
                  </p>
                </div>
                {analysis.repository?.url && (
                  <a
                    href={analysis.repository.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gray-800 rounded-xl text-white font-inter hover:bg-gray-700 transition-all"
                  >
                    View on GitHub →
                  </a>
                )}
              </div>
            </Card>

            {/* Statistics */}
            {analysis.statistics && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <AnimatedCard delay={0}>
                  <div className="p-6 text-center">
                    <FileCode className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <div className="text-3xl font-merriweather font-bold text-white mb-1">
                      {analysis.statistics.totalFiles || 0}
                    </div>
                    <div className="text-sm text-gray-400 font-inter">Total Files</div>
                  </div>
                </AnimatedCard>
                
                <AnimatedCard delay={0.1}>
                  <div className="p-6 text-center">
                    <Code2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                    <div className="text-3xl font-merriweather font-bold text-white mb-1">
                      {analysis.statistics.codeFiles || 0}
                    </div>
                    <div className="text-sm text-gray-400 font-inter">Code Files</div>
                  </div>
                </AnimatedCard>
                
                <AnimatedCard delay={0.2}>
                  <div className="p-6 text-center">
                    <Folder className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <div className="text-3xl font-merriweather font-bold text-white mb-1">
                      {analysis.statistics.directories || 0}
                    </div>
                    <div className="text-sm text-gray-400 font-inter">Directories</div>
                  </div>
                </AnimatedCard>
                
                <AnimatedCard delay={0.3}>
                  <div className="p-6 text-center">
                    <FileCode className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                    <div className="text-3xl font-merriweather font-bold text-white mb-1">
                      {analysis.statistics.configFiles || 0}
                    </div>
                    <div className="text-sm text-gray-400 font-inter">Config Files</div>
                  </div>
                </AnimatedCard>
                
                <AnimatedCard delay={0.4}>
                  <div className="p-6 text-center">
                    <FileCode className="w-8 h-8 text-pink-400 mx-auto mb-3" />
                    <div className="text-3xl font-merriweather font-bold text-white mb-1">
                      {analysis.statistics.docFiles || 0}
                    </div>
                    <div className="text-sm text-gray-400 font-inter">Doc Files</div>
                  </div>
                </AnimatedCard>
              </div>
            )}

            {/* AI Summary */}
            {analysis.summary && (
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-7 h-7 text-yellow-400" />
                  <h3 className="text-2xl font-merriweather font-bold text-white">AI Summary</h3>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 font-inter text-lg leading-relaxed whitespace-pre-wrap">
                    {analysis.summary}
                  </p>
                </div>
              </Card>
            )}

            {/* Technologies */}
            {analysis.technologies && (
              <Card className="p-8">
                <h3 className="text-2xl font-merriweather font-bold text-white mb-6">Technologies Detected</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Languages */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Code2 className="w-5 h-5 text-blue-400" />
                      <h4 className="text-lg font-semibold text-gray-300 font-inter">Languages</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.technologies.languages?.length > 0 ? (
                        analysis.technologies.languages.map((lang) => (
                          <Badge key={lang} variant="info" className="text-sm font-inter">
                            {lang}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 font-inter">None detected</span>
                      )}
                    </div>
                  </div>

                  {/* Frameworks */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-5 h-5 text-green-400" />
                      <h4 className="text-lg font-semibold text-gray-300 font-inter">Frameworks</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.technologies.frameworks?.length > 0 ? (
                        analysis.technologies.frameworks.map((fw) => (
                          <Badge key={fw} variant="success" className="text-sm font-inter">
                            {fw}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 font-inter">None detected</span>
                      )}
                    </div>
                  </div>

                  {/* Databases */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Database className="w-5 h-5 text-purple-400" />
                      <h4 className="text-lg font-semibold text-gray-300 font-inter">Databases</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.technologies.databases?.length > 0 ? (
                        analysis.technologies.databases.map((db) => (
                          <Badge key={db} variant="secondary" className="text-sm font-inter">
                            {db}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 font-inter">None detected</span>
                      )}
                    </div>
                  </div>

                  {/* Tools */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                      <h4 className="text-lg font-semibold text-gray-300 font-inter">Tools</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.technologies.tools?.length > 0 ? (
                        analysis.technologies.tools.map((tool) => (
                          <Badge key={tool} variant="warning" className="text-sm font-inter">
                            {tool}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 font-inter">None detected</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Architecture Patterns */}
            {analysis.patterns && analysis.patterns.length > 0 && (
              <Card className="p-8">
                <h3 className="text-2xl font-merriweather font-bold text-white mb-6">Architecture Patterns</h3>
                <div className="space-y-4">
                  {analysis.patterns.map((pattern, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-800 rounded-xl p-6 bg-gray-900/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <h4 className="text-lg font-semibold text-white font-inter">{pattern.name}</h4>
                            <Badge
                              variant={pattern.confidence === 'high' ? 'success' : 'warning'}
                              className="text-xs font-inter"
                            >
                              {pattern.confidence} confidence
                            </Badge>
                          </div>
                          <div className="ml-8">
                            <p className="text-sm text-gray-400 font-inter mb-2">Indicators:</p>
                            <ul className="space-y-1">
                              {pattern.indicators.map((indicator, idx) => (
                                <li key={idx} className="text-sm text-gray-500 font-inter">
                                  • {indicator}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <Card className="p-8 bg-gradient-to-br from-orange-500/10 to-red-500/10">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-7 h-7 text-orange-400" />
                  <h3 className="text-2xl font-merriweather font-bold text-white">Resilience Recommendations</h3>
                </div>
                <div className="space-y-4">
                  {analysis.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border-l-4 rounded-xl p-6 ${
                        rec.priority === 'high'
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-yellow-500 bg-yellow-500/10'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <AlertCircle
                          className={`w-6 h-6 ${
                            rec.priority === 'high' ? 'text-red-400' : 'text-yellow-400'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-white font-inter">{rec.title}</h4>
                            <Badge
                              variant={rec.priority === 'high' ? 'danger' : 'warning'}
                              className="text-xs font-inter"
                            >
                              {rec.priority} priority
                            </Badge>
                          </div>
                          <p className="text-gray-300 font-inter">{rec.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

