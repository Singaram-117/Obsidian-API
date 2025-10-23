import { HfInference } from '@huggingface/inference';
import axios from 'axios';
import logger from '../utils/logger.js';

// Initialize HuggingFace client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '');

const codeAnalyzerService = {
  /**
   * Fetch repository structure from GitHub
   */
  async fetchRepoStructure(githubUrl) {
    try {
      const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
      const match = githubUrl.match(regex);
      
      if (!match) {
        throw new Error('Invalid GitHub URL');
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '');

      // Fetch repo tree
      const apiUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/main?recursive=1`;
      const headers = {};
      
      if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const response = await axios.get(apiUrl, { headers });
      const tree = response.data.tree;

      // Filter and categorize files
      const structure = {
        codeFiles: tree.filter(item => 
          item.type === 'blob' && 
          /\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|cs|rb|php)$/.test(item.path)
        ),
        configFiles: tree.filter(item =>
          item.type === 'blob' &&
          /(package\.json|requirements\.txt|pom\.xml|Cargo\.toml|go\.mod|\.env)$/.test(item.path)
        ),
        docFiles: tree.filter(item =>
          item.type === 'blob' &&
          /(README|CONTRIBUTING|LICENSE|\.md)$/.test(item.path)
        ),
        directories: tree.filter(item => item.type === 'tree'),
        totalFiles: tree.filter(item => item.type === 'blob').length,
      };

      return {
        owner,
        repo: cleanRepo,
        structure,
        tree: tree.slice(0, 100), // Limit for performance
      };
    } catch (error) {
      logger.error('Failed to fetch repo structure:', error);
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  },

  /**
   * Analyze repository and generate insights using AI
   */
  async analyzeRepository(githubUrl) {
    try {
      // Fetch repo structure
      const repoData = await this.fetchRepoStructure(githubUrl);
      
      // Detect technologies
      const technologies = this.detectTechnologies(repoData.structure);
      
      // Build analysis prompt
      const prompt = this.buildAnalysisPrompt(repoData, technologies);
      
      // Generate summary using HuggingFace (fallback to rule-based)
      let aiSummary;
      try {
        aiSummary = await this.generateAISummary(prompt);
      } catch (error) {
        logger.warn('AI summary failed, using rule-based analysis', { error: error.message });
        aiSummary = this.generateRuleBasedSummary(repoData, technologies);
      }

      // Extract architecture patterns
      const patterns = this.detectArchitecturePatterns(repoData.structure);
      
      // Resilience recommendations
      const recommendations = this.generateRecommendations(repoData, technologies, patterns);

      return {
        repository: {
          owner: repoData.owner,
          repo: repoData.repo,
          url: githubUrl,
        },
        summary: aiSummary,
        technologies,
        patterns,
        statistics: {
          totalFiles: repoData.structure.totalFiles,
          codeFiles: repoData.structure.codeFiles.length,
          configFiles: repoData.structure.configFiles.length,
          docFiles: repoData.structure.docFiles.length,
          directories: repoData.structure.directories.length,
        },
        recommendations,
        analyzedAt: new Date(),
      };
    } catch (error) {
      logger.error('Repository analysis failed:', error);
      throw error;
    }
  },

  /**
   * Detect technologies from file structure
   */
  detectTechnologies(structure) {
    const technologies = {
      languages: new Set(),
      frameworks: new Set(),
      tools: new Set(),
      databases: new Set(),
    };

    // Analyze config files
    structure.configFiles.forEach(file => {
      if (file.path.includes('package.json')) {
        technologies.languages.add('JavaScript/Node.js');
        technologies.frameworks.add('npm');
      }
      if (file.path.includes('requirements.txt') || file.path.includes('setup.py')) {
        technologies.languages.add('Python');
        technologies.tools.add('pip');
      }
      if (file.path.includes('pom.xml')) {
        technologies.languages.add('Java');
        technologies.tools.add('Maven');
      }
      if (file.path.includes('Cargo.toml')) {
        technologies.languages.add('Rust');
        technologies.tools.add('Cargo');
      }
      if (file.path.includes('go.mod')) {
        technologies.languages.add('Go');
        technologies.tools.add('Go Modules');
      }
    });

    // Analyze code files
    structure.codeFiles.forEach(file => {
      if (/\.tsx?$/.test(file.path)) technologies.languages.add('TypeScript');
      if (/\.jsx?$/.test(file.path)) technologies.languages.add('JavaScript');
      if (/\.py$/.test(file.path)) technologies.languages.add('Python');
      if (/\.java$/.test(file.path)) technologies.languages.add('Java');
      if (/\.go$/.test(file.path)) technologies.languages.add('Go');
      if (/\.rs$/.test(file.path)) technologies.languages.add('Rust');
      if (/\.rb$/.test(file.path)) technologies.languages.add('Ruby');
      if (/\.php$/.test(file.path)) technologies.languages.add('PHP');

      // Framework detection
      if (file.path.includes('react')) technologies.frameworks.add('React');
      if (file.path.includes('vue')) technologies.frameworks.add('Vue');
      if (file.path.includes('angular')) technologies.frameworks.add('Angular');
      if (file.path.includes('express')) technologies.frameworks.add('Express');
      if (file.path.includes('django')) technologies.frameworks.add('Django');
      if (file.path.includes('flask')) technologies.frameworks.add('Flask');
      if (file.path.includes('spring')) technologies.frameworks.add('Spring');
    });

    // Database detection
    structure.codeFiles.forEach(file => {
      const pathLower = file.path.toLowerCase();
      if (pathLower.includes('mongo')) technologies.databases.add('MongoDB');
      if (pathLower.includes('postgres') || pathLower.includes('pg')) technologies.databases.add('PostgreSQL');
      if (pathLower.includes('mysql')) technologies.databases.add('MySQL');
      if (pathLower.includes('redis')) technologies.databases.add('Redis');
      if (pathLower.includes('elasticsearch')) technologies.databases.add('Elasticsearch');
    });

    return {
      languages: Array.from(technologies.languages),
      frameworks: Array.from(technologies.frameworks),
      tools: Array.from(technologies.tools),
      databases: Array.from(technologies.databases),
    };
  },

  /**
   * Detect architecture patterns
   */
  detectArchitecturePatterns(structure) {
    const patterns = [];

    const paths = structure.codeFiles.map(f => f.path.toLowerCase());
    
    // Microservices
    if (paths.some(p => p.includes('service') || p.includes('microservice'))) {
      patterns.push({
        name: 'Microservices Architecture',
        confidence: 'high',
        indicators: ['Service directories', 'Independent services'],
      });
    }

    // MVC
    if (paths.some(p => p.includes('controller')) && 
        paths.some(p => p.includes('model')) && 
        paths.some(p => p.includes('view'))) {
      patterns.push({
        name: 'MVC Pattern',
        confidence: 'high',
        indicators: ['Controllers', 'Models', 'Views'],
      });
    }

    // Layered Architecture
    if (paths.some(p => p.includes('/routes/') || p.includes('/api/')) &&
        paths.some(p => p.includes('/services/') || p.includes('/business/')) &&
        paths.some(p => p.includes('/models/') || p.includes('/entities/'))) {
      patterns.push({
        name: 'Layered Architecture',
        confidence: 'high',
        indicators: ['Routes/API layer', 'Service layer', 'Data layer'],
      });
    }

    // Event-Driven
    if (paths.some(p => p.includes('event') || p.includes('queue') || p.includes('kafka') || p.includes('rabbitmq'))) {
      patterns.push({
        name: 'Event-Driven Architecture',
        confidence: 'medium',
        indicators: ['Event handlers', 'Message queues'],
      });
    }

    // Clean Architecture
    if (paths.some(p => p.includes('/domain/')) && 
        paths.some(p => p.includes('/infrastructure/')) &&
        paths.some(p => p.includes('/application/'))) {
      patterns.push({
        name: 'Clean Architecture',
        confidence: 'high',
        indicators: ['Domain layer', 'Infrastructure layer', 'Application layer'],
      });
    }

    return patterns;
  },

  /**
   * Build analysis prompt for AI
   */
  buildAnalysisPrompt(repoData, technologies) {
    return `Analyze this GitHub repository:

Repository: ${repoData.repo}
Owner: ${repoData.owner}

Statistics:
- Total Files: ${repoData.structure.totalFiles}
- Code Files: ${repoData.structure.codeFiles.length}
- Config Files: ${repoData.structure.configFiles.length}

Technologies:
- Languages: ${technologies.languages.join(', ')}
- Frameworks: ${technologies.frameworks.join(', ')}
- Databases: ${technologies.databases.join(', ')}

Sample file structure:
${repoData.tree.slice(0, 20).map(f => `- ${f.path}`).join('\n')}

Provide a concise summary of:
1. What this repository does
2. Main technologies used
3. Architecture type
4. Key features`;
  },

  /**
   * Generate AI summary using HuggingFace
   */
  async generateAISummary(prompt) {
    try {
      // Use a smaller, faster model for summarization
      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.7,
          top_p: 0.95,
        },
      });

      return response.generated_text || 'Analysis complete.';
    } catch (error) {
      logger.warn('HuggingFace API failed, using fallback', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate rule-based summary as fallback
   */
  generateRuleBasedSummary(repoData, technologies) {
    const languages = technologies.languages.join(', ') || 'Unknown';
    const frameworks = technologies.frameworks.join(', ') || 'None detected';
    
    return `This repository "${repoData.repo}" appears to be a ${languages} project${frameworks ? ` using ${frameworks}` : ''}. 

The codebase contains ${repoData.structure.codeFiles.length} source files organized across ${repoData.structure.directories.length} directories. 

Based on the file structure, this appears to be a well-organized project with ${repoData.structure.docFiles.length} documentation files, suggesting good documentation practices.

${technologies.databases.length > 0 ? `The project uses ${technologies.databases.join(', ')} for data storage.` : ''}`;
  },

  /**
   * Generate resilience recommendations
   */
  generateRecommendations(repoData, technologies, patterns) {
    const recommendations = [];

    // Docker recommendation
    const hasDocker = repoData.structure.configFiles.some(f => 
      f.path.includes('Dockerfile') || f.path.includes('docker-compose')
    );
    if (!hasDocker) {
      recommendations.push({
        type: 'containerization',
        priority: 'high',
        title: 'Add Docker Support',
        description: 'Containerizing your application improves deployment consistency and resilience.',
      });
    }

    // CI/CD recommendation
    const hasCI = repoData.structure.configFiles.some(f =>
      f.path.includes('.github/workflows') || f.path.includes('.gitlab-ci') || f.path.includes('Jenkinsfile')
    );
    if (!hasCI) {
      recommendations.push({
        type: 'ci-cd',
        priority: 'medium',
        title: 'Implement CI/CD Pipeline',
        description: 'Automated testing and deployment reduces manual errors and improves reliability.',
      });
    }

    // Monitoring recommendation
    const hasMonitoring = repoData.structure.codeFiles.some(f =>
      f.path.toLowerCase().includes('monitor') || 
      f.path.toLowerCase().includes('metrics') ||
      f.path.toLowerCase().includes('health')
    );
    if (!hasMonitoring) {
      recommendations.push({
        type: 'observability',
        priority: 'high',
        title: 'Add Monitoring & Health Checks',
        description: 'Implement health check endpoints and metrics collection for better observability.',
      });
    }

    // Circuit breaker for microservices
    if (patterns.some(p => p.name.includes('Microservice'))) {
      recommendations.push({
        type: 'resilience',
        priority: 'high',
        title: 'Implement Circuit Breaker Pattern',
        description: 'Protect your microservices from cascading failures with circuit breakers.',
      });
    }

    // Error handling
    const hasErrorHandling = repoData.structure.codeFiles.some(f =>
      f.path.toLowerCase().includes('error') || f.path.toLowerCase().includes('exception')
    );
    if (!hasErrorHandling) {
      recommendations.push({
        type: 'error-handling',
        priority: 'medium',
        title: 'Centralize Error Handling',
        description: 'Implement centralized error handling middleware for consistent error responses.',
      });
    }

    return recommendations;
  },
};

export default codeAnalyzerService;

