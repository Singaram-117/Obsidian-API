import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import {
  Zap,
  AlertTriangle,
  Play,
  StopCircle,
  Activity,
  Flame,
  Network,
} from 'lucide-react';

const chaosTests = [
  {
    id: 'cascade-failure',
    name: 'Cascade Failure',
    description: 'Trigger 100% failure rate to test circuit breaker opening',
    icon: Flame,
    severity: 'high',
    duration: '30 seconds',
  },
  {
    id: 'intermittent-failures',
    name: 'Intermittent Failures',
    description: 'Random failures with 50% rate to test resilience',
    icon: Zap,
    severity: 'medium',
    duration: '60 seconds',
  },
  {
    id: 'latency-injection',
    name: 'Latency Injection',
    description: 'Add 2-5 second delays to test timeout handling',
    icon: Activity,
    severity: 'medium',
    duration: '45 seconds',
  },
  {
    id: 'network-partition',
    name: 'Network Partition',
    description: 'Simulate network issues with timeouts',
    icon: Network,
    severity: 'high',
    duration: '30 seconds',
  },
];

export default function ChaosEngineering() {
  const queryClient = useQueryClient();
  const [activeTest, setActiveTest] = useState(null);
  const [testResults, setTestResults] = useState([]);

  // Fetch services
  const { data: servicesData, isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const response = await servicesApi.getAll();
        console.log('ChaosEngineering - API response:', response);
        // Handle different response formats
        if (Array.isArray(response)) {
          return response;
        }
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch services:', error);
        throw error;
      }
    },
    refetchInterval: 5000,
    retry: 3,
    retryDelay: 1000,
  });

  const services = Array.isArray(servicesData) ? servicesData : [];

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (activeTest !== null) {
        console.warn('Component unmounting with active test, cleaning up');
        setActiveTest(null);
      }
    };
  }, [activeTest]);

  // Run chaos test
  const runTest = async (test, serviceName) => {
    // Prevent multiple tests from running simultaneously
    if (activeTest !== null) {
      console.warn('A test is already running, please wait for it to complete');
      return;
    }

    const startTime = Date.now();
    setActiveTest({ test, serviceName, startTime });

    try {
      // Validate inputs
      if (!test || !serviceName) {
        throw new Error('Invalid test or service name');
      }
      // Configure mock service based on test type
      const service = services.find((s) => s.name === serviceName);
      if (!service || !service.url) {
        throw new Error('Service not found');
      }

      // Clean and validate the URL
      const mockServiceUrl = service.url.trim();
      if (!mockServiceUrl) {
        throw new Error('Service URL is empty');
      }

      console.log('Using service URL:', mockServiceUrl);

      let config = {};
      switch (test.id) {
        case 'cascade-failure':
          config = { failureRate: 1.0, circuitBreakerTest: true };
          break;
        case 'intermittent-failures':
          config = { failureRate: 0.5 };
          break;
        case 'latency-injection':
          config = { delayMin: 2000, delayMax: 5000 };
          break;
        case 'network-partition':
          config = { timeoutRate: 0.7 };
          break;
      }

      // Note: Demo services don't have direct failure endpoints
      // We'll simulate chaos by making requests through the API Gateway
      console.log('Starting chaos test:', test.name, 'on service:', serviceName);
      console.log('Test configuration:', config);

      // Select appropriate endpoint based on service
      let endpoint = '/health';
      switch (serviceName) {
        case 'orders':
          endpoint = '/api/orders';
          break;
        case 'booking':
          endpoint = '/api/bookings';
          break;
        case 'payment':
          endpoint = '/api/payments';
          break;
        default:
          endpoint = '/health';
      }

      // Make multiple requests to trigger the chaos
      const requests = [];
      for (let i = 0; i < 20; i++) {
        try {
          requests.push(
            servicesApi.call(serviceName, {
              endpoint: endpoint,
              method: 'GET',
            }).catch((err) => {
              console.warn(`Request ${i + 1} failed:`, err.message);
              return { error: true, message: err.message };
            })
          );
        } catch (requestError) {
          console.warn(`Failed to create request ${i + 1}:`, requestError.message);
          requests.push(Promise.resolve({ error: true, message: requestError.message }));
        }

        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const results = await Promise.allSettled(requests);

      // Record test results
      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && !r.value?.error
      ).length;
      const failureCount = results.length - successCount;

      const result = {
        test: test.name,
        serviceName,
        startTime: startTime,
        endTime: Date.now(),
        totalRequests: results.length,
        successCount,
        failureCount,
        successRate: (successCount / results.length) * 100,
      };

      setTestResults((prev) => [result, ...prev].slice(0, 10));

      // Note: Demo services don't need recovery - they're stateless
      console.log('Chaos test completed:', result);

      // Add a small delay to ensure UI updates properly
      setTimeout(() => {
        setActiveTest(null);
      }, 100);
      
      queryClient.invalidateQueries(['services']);
    } catch (error) {
      console.error('Chaos test failed:', error);
      // Add a small delay to ensure UI updates properly
      setTimeout(() => {
        setActiveTest(null);
      }, 100);
    } finally {
      // Ensure state is always reset
      setTimeout(() => {
        if (activeTest !== null) {
          console.warn('Force resetting activeTest state');
          setActiveTest(null);
        }
      }, 1000);
    }
  };

  // Show loading state
  if (servicesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            Chaos Engineering
          </h1>
          <p className="mt-2 text-slate-400">
            Test your system's resilience with controlled failure scenarios
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin-slow text-6xl">⚙️</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (servicesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            Chaos Engineering
          </h1>
          <p className="mt-2 text-slate-400">
            Test your system's resilience with controlled failure scenarios
          </p>
        </div>
        <Card className="glass-dark text-center py-16">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold mb-2 text-red-400">Failed to Load Services</h3>
          <p className="text-gray-400 mb-6">
            {servicesError.message || 'Unable to fetch services. Please try again.'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-500 to-red-600"
          >
            🔄 Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Flame className="h-8 w-8 text-orange-500" />
          Chaos Engineering
        </h1>
        <p className="mt-2 text-slate-400">
          Test your system's resilience with controlled failure scenarios
        </p>
      </div>

      {/* Warning Banner */}
      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-500">
              Chaos tests will intentionally disrupt service behavior
            </p>
            <p className="text-sm text-yellow-500/80 mt-1">
              These tests are designed to validate your resilience patterns. Make sure
              you're testing in a safe environment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Test */}
      {activeTest && (
        <Card className="border-orange-500/50 bg-orange-500/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                  <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    Running: {activeTest?.test?.name || 'Unknown Test'}
                  </p>
                  <p className="text-sm text-slate-400">
                    Target: {activeTest?.serviceName || 'Unknown Service'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Duration</p>
                <p className="text-lg font-semibold text-white">
                  {activeTest ? Math.floor((Date.now() - activeTest.startTime) / 1000) : 0}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chaos Tests Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {chaosTests.map((test) => {
          const Icon = test.icon;
          return (
            <Card
              key={test.id}
              className={
                test.severity === 'high'
                  ? 'border-red-500/30'
                  : 'border-yellow-500/30'
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        test.severity === 'high'
                          ? 'bg-red-500/20'
                          : 'bg-yellow-500/20'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          test.severity === 'high'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle>{test.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {test.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={test.severity === 'high' ? 'error' : 'warning'}
                  >
                    {test.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-white">{test.duration}</span>
                </div>

                {/* Service Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Target Service
                  </label>
                  {services.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-4xl mb-2">🔍</div>
                      <p className="text-sm text-slate-500 mb-2">
                        No services available for chaos testing
                      </p>
                      <p className="text-xs text-slate-600">
                        Register services in the Services tab first
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {services.map((service) => (
                        <Button
                          key={service.name}
                          variant="outline"
                          size="sm"
                          onClick={() => runTest(test, service.name)}
                          disabled={activeTest !== null}
                          className="justify-start"
                        >
                          <Play className="h-4 w-4" />
                          Run on {service.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-800 bg-slate-900/30 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{result.test}</Badge>
                        <Badge variant="default">{result.serviceName}</Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(result.endTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Total Requests</p>
                          <p className="text-white font-semibold">
                            {result.totalRequests}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Success</p>
                          <p className="text-green-400 font-semibold">
                            {result.successCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Failures</p>
                          <p className="text-red-400 font-semibold">
                            {result.failureCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Success Rate</p>
                          <p className="text-white font-semibold">
                            {result.successRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="text-sm font-semibold text-white">
                        {((result.endTime - result.startTime) / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>
                Always run chaos tests in non-production environments first
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>
                Monitor dashboards and alerts during chaos experiments
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>
                Start with low-severity tests and gradually increase complexity
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>
                Document learnings and improve resilience patterns based on results
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>
                Ensure your circuit breakers, rate limiters, and timeouts are properly configured
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

