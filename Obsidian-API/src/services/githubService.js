import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * GitHub Integration Service
 * Fetches repository information and README content
 */
class GitHubService {
  constructor() {
    this.githubAPI = 'https://api.github.com';
  }

  parseGitHubUrl(url) {
    // Supports: https://github.com/owner/repo or git@github.com:owner/repo.git
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/\.]+)/,
      /github\.com:([^\/]+)\/([^\/\.]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', ''),
        };
      }
    }

    return null;
  }

  /**
   * Fetch repository information
   */
  async getRepoInfo(githubUrl) {
    try {
      const parsed = this.parseGitHubUrl(githubUrl);
      if (!parsed) {
        throw new Error('Invalid GitHub URL');
      }

      const { owner, repo } = parsed;
      const response = await axios.get(`${this.githubAPI}/repos/${owner}/${repo}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 5000,
      });

      const repoData = response.data;

      return {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        language: repoData.language,
        license: repoData.license?.name || 'None',
        topics: repoData.topics || [],
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        homepage: repoData.homepage,
        url: repoData.html_url,
        defaultBranch: repoData.default_branch,
        owner: {
          name: repoData.owner.login,
          avatar: repoData.owner.avatar_url,
          url: repoData.owner.html_url,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch GitHub repo info', {
        error: error.message,
        url: githubUrl,
      });
      throw error;
    }
  }

  /**
   * Fetch README content
   */
  async getReadme(githubUrl) {
    try {
      const parsed = this.parseGitHubUrl(githubUrl);
      if (!parsed) {
        throw new Error('Invalid GitHub URL');
      }

      const { owner, repo } = parsed;
      const response = await axios.get(
        `${this.githubAPI}/repos/${owner}/${repo}/readme`,
        {
          headers: {
            Accept: 'application/vnd.github.v3.raw',
          },
          timeout: 5000,
        }
      );

      return {
        content: response.data,
        type: 'markdown',
      };
    } catch (error) {
      logger.error('Failed to fetch README', {
        error: error.message,
        url: githubUrl,
      });
      return {
        content: 'README not found or could not be fetched.',
        type: 'text',
      };
    }
  }

  /**
   * Get repository contributors
   */
  async getContributors(githubUrl, limit = 5) {
    try {
      const parsed = this.parseGitHubUrl(githubUrl);
      if (!parsed) {
        throw new Error('Invalid GitHub URL');
      }

      const { owner, repo } = parsed;
      const response = await axios.get(
        `${this.githubAPI}/repos/${owner}/${repo}/contributors`,
        {
          params: { per_page: limit },
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
          timeout: 5000,
        }
      );

      return response.data.map((contributor) => ({
        username: contributor.login,
        avatar: contributor.avatar_url,
        contributions: contributor.contributions,
        url: contributor.html_url,
      }));
    } catch (error) {
      logger.error('Failed to fetch contributors', {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get latest releases
   */
  async getLatestRelease(githubUrl) {
    try {
      const parsed = this.parseGitHubUrl(githubUrl);
      if (!parsed) {
        throw new Error('Invalid GitHub URL');
      }

      const { owner, repo } = parsed;
      const response = await axios.get(
        `${this.githubAPI}/repos/${owner}/${repo}/releases/latest`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
          timeout: 5000,
        }
      );

      const release = response.data;

      return {
        tagName: release.tag_name,
        name: release.name,
        publishedAt: release.published_at,
        url: release.html_url,
        body: release.body,
      };
    } catch (error) {
      logger.debug('No releases found or failed to fetch', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get complete service information from GitHub
   */
  async getCompleteInfo(githubUrl) {
    try {
      const [repoInfo, readme, contributors, latestRelease] = await Promise.all([
        this.getRepoInfo(githubUrl),
        this.getReadme(githubUrl),
        this.getContributors(githubUrl),
        this.getLatestRelease(githubUrl),
      ]);

      return {
        repository: repoInfo,
        readme,
        contributors,
        latestRelease,
      };
    } catch (error) {
      logger.error('Failed to fetch complete GitHub info', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton
const githubService = new GitHubService();
export default githubService;

