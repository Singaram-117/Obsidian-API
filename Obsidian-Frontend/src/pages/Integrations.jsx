import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import {
  GitBranch,
  Cloud,
  Container,
  Layers,
  Code,
  Link as LinkIcon,
  RefreshCw,
  Zap,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const integrationMethods = [
  {
    id: 'manual',
    name: 'Manual URL',
    description: 'Register services manually by URL',
    icon: LinkIcon,
    color: 'blue',
    setupTime: '1 min',
  },
  {
    id: 'sdk',
    name: 'SDK/Agent',
    description: 'Drop-in library for automatic registration',
    icon: Code,
    color: 'green',
    setupTime: '5 min',
  },
  {
    id: 'git',
    name: 'Git Repository',
    description: 'Deploy and monitor from Git',
    icon: GitBranch,
    color: 'purple',
    setupTime: '10 min',
  },
  {
    id: 'consul',
    name: 'Consul',
    description: 'Service discovery via Consul',
    icon: Cloud,
    color: 'pink',
    setupTime: '5 min',
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Auto-discover Docker containers',
    icon: Container,
    color: 'cyan',
    setupTime: '5 min',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Auto-discover K8s services',
    icon: Layers,
    color: 'indigo',
    setupTime: '15 min',
  },
];

export default function Integrations() {
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [gitConfig, setGitConfig] = useState({
    name: '',
    repoUrl: '',
    branch: 'main',
    port: '',
    buildCommand: 'npm install',
    startCommand: 'npm start',
  });

  // Fetch Git deployments
  const { data: deploymentsData } = useQuery({
    queryKey: ['git-deployments'],
    queryFn: () => axios.get(`${API_URL}/api/integrations/git/deployments`).then(r => r.data),
    refetchInterval: 10000,
  });

  // Git registration mutation
  const registerGitMutation = useMutation({
    mutationFn: (config) =>
      axios.post(`${API_URL}/api/integrations/git/register`, config),
    onSuccess: () => {
      queryClient.invalidateQueries(['git-deployments']);
      queryClient.invalidateQueries(['services']);
      setSelectedMethod(null);
      setGitConfig({
        name: '',
        repoUrl: '',
        branch: 'main',
        port: '',
        buildCommand: 'npm install',
        startCommand: 'npm start',
      });
    },
  });

  // Service discovery mutations
  const consulMutation = useMutation({
    mutationFn: (config) =>
      axios.post(`${API_URL}/api/integrations/discovery/consul`, config),
    onSuccess: () => {
      queryClient.invalidateQueries(['services']);
    },
  });

  const dockerMutation = useMutation({
    mutationFn: () =>
      axios.post(`${API_URL}/api/integrations/discovery/docker`),
    onSuccess: () => {
      queryClient.invalidateQueries(['services']);
    },
  });

  const kubernetesMutation = useMutation({
    mutationFn: () =>
      axios.post(`${API_URL}/api/integrations/discovery/kubernetes`),
    onSuccess: () => {
      queryClient.invalidateQueries(['services']);
    },
  });

  const deployments = deploymentsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Integrations</h1>
        <p className="mt-2 text-slate-400">
          Multiple ways to register and monitor your microservices
        </p>
      </div>

      {/* Integration Methods Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {integrationMethods.map((method) => {
          const Icon = method.icon;
          return (
            <Card
              key={method.id}
              className="cursor-pointer transition-all hover:border-obsidian-500"
              onClick={() => setSelectedMethod(method.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${method.color}-500/20`}>
                      <Icon className={`h-5 w-5 text-${method.color}-500`} />
                    </div>
                    <div>
                      <CardTitle>{method.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {method.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="default">⚡ {method.setupTime}</Badge>
                  <Button size="sm" variant="outline">
                    Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Git Integration Form */}
      {selectedMethod === 'git' && (
        <Card className="border-purple-500/50">
          <CardHeader>
            <CardTitle>Register from Git Repository</CardTitle>
            <CardDescription>
              Deploy and monitor your service directly from Git
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerGitMutation.mutate(gitConfig);
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={gitConfig.name}
                    onChange={(e) =>
                      setGitConfig({ ...gitConfig, name: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={gitConfig.repoUrl}
                    onChange={(e) =>
                      setGitConfig({ ...gitConfig, repoUrl: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                    placeholder="https://github.com/user/repo.git"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={gitConfig.branch}
                    onChange={(e) =>
                      setGitConfig({ ...gitConfig, branch: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={gitConfig.port}
                    onChange={(e) =>
                      setGitConfig({ ...gitConfig, port: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              {registerGitMutation.isError && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                  {registerGitMutation.error?.response?.data?.error ||
                    registerGitMutation.error?.message}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedMethod(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={registerGitMutation.isPending}
                >
                  {registerGitMutation.isPending
                    ? 'Deploying...'
                    : 'Deploy & Register'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Service Discovery Actions */}
      {selectedMethod === 'consul' && (
        <Card>
          <CardHeader>
            <CardTitle>Consul Service Discovery</CardTitle>
            <CardDescription>
              Auto-discover services from Consul registry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() =>
                consulMutation.mutate({
                  consulUrl: 'http://localhost:8500',
                  periodic: true,
                  interval: 60000,
                })
              }
              disabled={consulMutation.isPending}
            >
              {consulMutation.isPending ? 'Discovering...' : 'Discover Services'}
            </Button>
            {consulMutation.isSuccess && (
              <p className="mt-4 text-sm text-green-400">
                ✓ Discovered {consulMutation.data?.data?.count} services
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedMethod === 'docker' && (
        <Card>
          <CardHeader>
            <CardTitle>Docker Container Discovery</CardTitle>
            <CardDescription>
              Auto-discover running Docker containers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => dockerMutation.mutate()}
              disabled={dockerMutation.isPending}
            >
              {dockerMutation.isPending ? 'Discovering...' : 'Discover Containers'}
            </Button>
            {dockerMutation.isSuccess && (
              <p className="mt-4 text-sm text-green-400">
                ✓ Discovered {dockerMutation.data?.data?.count} containers
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedMethod === 'kubernetes' && (
        <Card>
          <CardHeader>
            <CardTitle>Kubernetes Service Discovery</CardTitle>
            <CardDescription>
              Auto-discover Kubernetes services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => kubernetesMutation.mutate()}
              disabled={kubernetesMutation.isPending}
            >
              {kubernetesMutation.isPending
                ? 'Discovering...'
                : 'Discover Services'}
            </Button>
            {kubernetesMutation.isSuccess && (
              <p className="mt-4 text-sm text-green-400">
                ✓ Discovered {kubernetesMutation.data?.data?.count} services
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Git Deployments */}
      {deployments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Git Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deployments.map((deployment) => (
                <div
                  key={deployment.name}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 p-4"
                >
                  <div>
                    <h4 className="font-medium text-white">{deployment.name}</h4>
                    <p className="text-sm text-slate-400">{deployment.repoUrl}</p>
                    <Badge
                      variant={deployment.running ? 'success' : 'error'}
                      className="mt-2"
                    >
                      {deployment.running ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4" />
                    Redeploy
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SDK Installation Guide */}
      {selectedMethod === 'sdk' && (
        <Card className="border-green-500/50">
          <CardHeader>
            <CardTitle>SDK/Agent Integration</CardTitle>
            <CardDescription>
              Add @obsidian/agent to your Node.js service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">
                1. Install the package
              </p>
              <pre className="rounded bg-slate-950 p-3 text-sm text-slate-300">
                npm install @obsidian/agent
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">
                2. Add to your service
              </p>
              <pre className="rounded bg-slate-950 p-3 text-sm text-slate-300">
{`import { createAgent } from '@obsidian/agent';

const agent = createAgent({
  obsidianUrl: '${API_URL}'
});`}
              </pre>
            </div>
            <div>
              <p className="text-sm text-slate-400">
                ✓ Your service will automatically register and send metrics!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

