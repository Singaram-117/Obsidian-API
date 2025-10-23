import { useState } from 'react';
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
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
    refetchInterval: 5000,
  });

  const services = servicesData?.data || [];

  // Run chaos test
  const runTest = async (test, serviceName) => {
    setActiveTest({ test, serviceName, startTime: Date.now() });

    try {
      // Configure mock service based on test type
      const mockServiceUrl = services.find((s) => s.name === serviceName)?.url;

      if (!mockServiceUrl) {
        throw new Error('Service not found');
      }

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

      // Apply configuration to mock service
      await fetch(`${mockServiceUrl}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      // Make multiple requests to trigger the chaos
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(
          servicesApi.call(serviceName, {
            endpoint: '/api/data',
            method: 'GET',
          }).catch((err) => ({ error: true, message: err.message }))
        );

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
        startTime: activeTest.startTime,
        endTime: Date.now(),
        totalRequests: results.length,
        successCount,
        failureCount,
        successRate: (successCount / results.length) * 100,
      };

      setTestResults((prev) => [result, ...prev].slice(0, 10));

      // Reset mock service configuration
      await fetch(`${mockServiceUrl}/config/reset`, {
        method: 'POST',
      });

      setActiveTest(null);
      queryClient.invalidateQueries(['services']);
    } catch (error) {
      console.error('Chaos test failed:', error);
      setActiveTest(null);
    }
  };

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
                    Running: {activeTest.test.name}
                  </p>
                  <p className="text-sm text-slate-400">
                    Target: {activeTest.serviceName}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Duration</p>
                <p className="text-lg font-semibold text-white">
                  {Math.floor((Date.now() - activeTest.startTime) / 1000)}s
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
                  <div className="grid gap-2">
                    {services.map((service) => (
                      <Button
                        key={service.name}
                        variant="outline"
                        size="sm"
                        onClick={() => runTest(test, service.name)}
                        disabled={activeTest !== null || services.length === 0}
                        className="justify-start"
                      >
                        <Play className="h-4 w-4" />
                        Run on {service.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {services.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No services available. Register a service first.
                  </p>
                )}
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

