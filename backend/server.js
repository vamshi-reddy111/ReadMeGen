// Import and configure dotenv to load environment variables from the backend .env file
// This allows sensitive information like API keys to be stored securely outside source control
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import the Express module
const express = require('express');

// Import Axios for making HTTP requests to the GitHub API
const axios = require('axios');

// Import the CORS middleware to allow requests from the Vite frontend origin only
const cors = require('cors');

// Import GoogleGenAI SDK for Gemini API integration
// Used to generate README content using the Gemini language model
const { GoogleGenAI } = require('@google/genai');

// Create an Express application instance
const app = express();

// Configure CORS to allow only the Vite frontend running on localhost:5173
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware: Enable JSON request body parsing
// This allows the server to accept and parse incoming JSON requests
app.use(express.json());

// Initialize the Gemini API client using the GEMINI_API_KEY from environment variables
// This client is used to generate README content
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Optional GitHub PAT support for higher API limits.
// The token remains on the backend only and is never exposed to the frontend.
function getGitHubHeaders() {
    const headers = {
        Accept: 'application/vnd.github+json'
    };

    const githubToken = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.trim() : null;

    if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`;
    }

    return headers;
}

// Helper function to detect actual frameworks and tooling from package dependencies
// Only well-known frameworks/tools are reported; libraries that are not frameworks are excluded.
function detectFrameworks(packageInfo, importantFiles = [], repositoryName = '') {
    const frameworks = [];
    const allDeps = {
        ...((packageInfo && packageInfo.dependencies) || {}),
        ...((packageInfo && packageInfo.devDependencies) || {})
    };
    const depNames = Object.keys(allDeps);
    const fileNames = Array.isArray(importantFiles) ? importantFiles : [];

    if (depNames.some(dep => dep === 'react' || dep === 'react-dom')) {
        frameworks.push('React');
    }
    if (depNames.some(dep => dep === 'next')) {
        frameworks.push('Next.js');
    }
    if (depNames.some(dep => dep === 'vue' || dep === 'vue-router' || dep === '@vue/runtime-dom')) {
        frameworks.push('Vue');
    }
    if (depNames.some(dep => dep === '@angular/core' || dep === '@angular/cli' || dep === '@angular/common')) {
        frameworks.push('Angular');
    }
    if (depNames.some(dep => dep === 'express')) {
        frameworks.push('Express');
    }
    if (depNames.some(dep => dep === 'vite' || dep === 'vitest' || dep.startsWith('@vitejs/'))) {
        frameworks.push('Vite');
    }
    if (depNames.some(dep => dep === 'webpack' || dep === 'webpack-cli' || dep === 'webpack-dev-server')) {
        frameworks.push('Webpack');
    }

    if (fileNames.some(file => /^vite\.config\.(js|mjs|ts|mts)$/.test(file))) {
        frameworks.push('Vite');
    }
    if (fileNames.some(file => /^next\.config\.(js|mjs|ts|cjs)$/.test(file))) {
        frameworks.push('Next.js');
    }
    if (fileNames.includes('angular.json')) {
        frameworks.push('Angular');
    }
    if (fileNames.some(file => /^vue\.config\.(js|ts)$/.test(file))) {
        frameworks.push('Vue');
    }
    if (fileNames.some(file => /^webpack\.config\.(js|mjs|ts|cjs)$/.test(file))) {
        frameworks.push('Webpack');
    }
    if ((repositoryName || '').toLowerCase() === 'react' || (packageInfo && packageInfo.name && packageInfo.name.toLowerCase() === 'react')) {
        frameworks.push('React');
    }

    return [...new Set(frameworks)];
}

// Helper function to detect the package manager used in the project
// This function infers the package manager from the presence of common package manager packages
function detectPackageManager(packageInfo, importantFiles = []) {
    if (importantFiles.includes('pnpm-lock.yaml')) return 'pnpm';
    if (importantFiles.includes('yarn.lock')) return 'yarn';
    if (importantFiles.includes('package-lock.json')) return 'npm';
    if (!packageInfo) return 'npm';

    const allDeps = {
        ...(packageInfo.dependencies || {}),
        ...(packageInfo.devDependencies || {})
    };
    const depNames = Object.keys(allDeps);

    if (depNames.some(dep => dep === 'pnpm')) {
        return 'pnpm';
    }
    if (depNames.some(dep => dep === 'yarn')) {
        return 'yarn';
    }

    return 'npm';
}

function buildProjectStructure(contentsData) {
    const items = Array.isArray(contentsData) ? contentsData : [];
    const directories = items
        .filter(item => item && item.type === 'dir' && item.name)
        .map(item => item.name)
        .sort();
    const files = items
        .filter(item => item && item.type === 'file' && item.name)
        .map(item => item.name)
        .sort();

    return {
        rootDirectories: directories,
        rootFiles: files.slice(0, 30)
    };
}

function getImportantFiles(contentsData) {
    const items = Array.isArray(contentsData) ? contentsData : [];
    const knownFiles = [
        'README.md',
        'package.json',
        'package-lock.json',
        'pnpm-lock.yaml',
        'yarn.lock',
        'requirements.txt',
        'pyproject.toml',
        'pom.xml',
        'Cargo.toml',
        'go.mod',
        'tsconfig.json',
        'vite.config.js',
        'vite.config.mjs',
        'vite.config.ts',
        'vite.config.mts',
        'next.config.js',
        'next.config.mjs',
        'next.config.ts',
        'next.config.cjs',
        'angular.json',
        'vue.config.js',
        'vue.config.ts',
        'webpack.config.js',
        'webpack.config.mjs',
        'webpack.config.ts',
        'webpack.config.cjs',
        'tailwind.config.js',
        'tailwind.config.ts',
        'Dockerfile'
    ];

    return items
        .filter(item => item && item.type === 'file' && knownFiles.includes(item.name))
        .map(item => item.name)
        .sort();
}

function detectTechnologies(packageInfo, languages, frameworks, importantFiles = [], projectStructure = {}, repositoryName = '') {
    const dependencyNames = Object.keys({
        ...((packageInfo && packageInfo.dependencies) || {}),
        ...((packageInfo && packageInfo.devDependencies) || {})
    }).map(name => name.toLowerCase());
    const detected = [
        ...(Array.isArray(languages) ? languages : []),
        ...(Array.isArray(frameworks) ? frameworks : [])
    ];
    const technologyMap = [
        [
            ['typescript'], 'TypeScript'
        ],
        [
            ['tailwindcss'], 'Tailwind CSS'
        ],
        [
            ['prisma', '@prisma/client'], 'Prisma'
        ],
        [
            ['mongoose', 'mongodb'], 'MongoDB'
        ],
        [
            ['graphql', '@apollo/client'], 'GraphQL'
        ],
        [
            ['jest', 'vitest', 'mocha'], 'JavaScript testing'
        ],
        [
            ['playwright', 'cypress'], 'Browser testing'
        ],
        [
            ['eslint'], 'ESLint'
        ],
        [
            ['prettier'], 'Prettier'
        ]
    ];

    technologyMap.forEach(([names, label]) => {
        if (names.some(name => dependencyNames.includes(name))) {
            detected.push(label);
        }
    });

    const fileNames = Array.isArray(importantFiles) ? importantFiles : [];
    const rootDirectories = Array.isArray(projectStructure.rootDirectories) ?
        projectStructure.rootDirectories : [];
    if (fileNames.includes('package.json')) {
        detected.push('Node.js');
    }
    if (fileNames.some(file => /^tailwind\.config\.(js|ts)$/.test(file))) {
        detected.push('Tailwind CSS');
    }
    if (rootDirectories.includes('node_modules')) {
        detected.push('Node.js');
    }
    if ((repositoryName || '').toLowerCase() === 'react' || (packageInfo && packageInfo.name && packageInfo.name.toLowerCase() === 'react')) {
        detected.push('React');
    }

    return [...new Set(detected.filter(Boolean))].slice(0, 12);
}

function getCombinedDependencies(packageInfo) {
    if (!packageInfo) return [];

    const allDeps = {
        ...(packageInfo.dependencies || {}),
        ...(packageInfo.devDependencies || {})
    };

    const dependencyNames = Object.keys(allDeps)
        .filter(Boolean)
        .map(dep => dep.trim())
        .filter(Boolean);

    return [...new Set(dependencyNames)].sort();
}

function getImportantScripts(scripts) {
    if (!scripts || typeof scripts !== 'object') return {};

    const relevantScripts = ['dev', 'start', 'build', 'test', 'lint', 'preview'];
    const importantScripts = {};

    relevantScripts.forEach((scriptName) => {
        if (Object.prototype.hasOwnProperty.call(scripts, scriptName)) {
            importantScripts[scriptName] = scripts[scriptName];
        }
    });

    return importantScripts;
}

// Helper function to transform collected repository data into a standardized project summary
// This function takes the raw repoInfo object from GitHub API calls and transforms it
// into a clean, standardized format suitable for README generation
function buildProjectSummary(repoInfo) {
    const packageInfo = repoInfo.packageInfo || { dependencies: {}, devDependencies: {}, scripts: {} };

    const frameworks = detectFrameworks(packageInfo, repoInfo.importantFiles, repoInfo.name);
    const packageManager = detectPackageManager(packageInfo, repoInfo.importantFiles);
    const dependencies = getCombinedDependencies(packageInfo);
    const scripts = Object.keys(packageInfo.scripts || {});
    const importantScripts = getImportantScripts(packageInfo.scripts || {});
    const technologies = detectTechnologies(
        packageInfo,
        repoInfo.languages,
        frameworks,
        repoInfo.importantFiles,
        repoInfo.projectStructure,
        repoInfo.name || (repoInfo.full_name ? repoInfo.full_name.split('/').pop() : '')
    );
    const owner = repoInfo.owner || (repoInfo.full_name ? repoInfo.full_name.split('/')[0] : '') || '';
    const repo = repoInfo.repo || (repoInfo.full_name ? repoInfo.full_name.split('/')[1] : '') || repoInfo.name || '';
    const repositoryUrl = owner && repo ? `https://github.com/${owner}/${repo}` : '';

    console.log(`[buildProjectSummary] ${owner}/${repo}: dependencies=${JSON.stringify(dependencies)} frameworks=${JSON.stringify(frameworks)}`);

    return {
        name: repoInfo.name || '',
        description: repoInfo.description || '',
        repository: repositoryUrl,
        defaultBranch: repoInfo.default_branch || '',
        license: repoInfo.license || '',
        languages: Array.isArray(repoInfo.languages) ? repoInfo.languages : [],
        frameworks: Array.isArray(frameworks) ? frameworks : [],
        technologies: Array.isArray(technologies) ? technologies : [],
        dependencies: Array.isArray(dependencies) ? dependencies : [],
        scripts: Array.isArray(scripts) ? scripts : [],
        importantScripts: importantScripts || {},
        packageManager: packageManager || 'npm',
        packageJsonAvailable: Array.isArray(repoInfo.importantFiles) && repoInfo.importantFiles.includes('package.json'),
        importantFiles: Array.isArray(repoInfo.importantFiles) ? repoInfo.importantFiles : [],
        projectStructure: repoInfo.projectStructure || { rootDirectories: [], rootFiles: [] }
    };
}

// Helper function to build a prompt for Gemini to generate a professional README
// This function constructs a detailed prompt that instructs the model to generate
// a README with specific sections using only the provided project information
function buildReadmePrompt(projectSummary) {
    const languages = Array.isArray(projectSummary.languages) ? projectSummary.languages : [];
    const frameworks = Array.isArray(projectSummary.frameworks) ? projectSummary.frameworks : [];
    const technologies = Array.isArray(projectSummary.technologies) ? projectSummary.technologies : [];
    const importantFiles = Array.isArray(projectSummary.importantFiles) ? projectSummary.importantFiles : [];
    const projectStructure = projectSummary.projectStructure && typeof projectSummary.projectStructure === 'object' ?
        projectSummary.projectStructure : { rootDirectories: [], rootFiles: [] };
    const importantScripts = projectSummary.importantScripts && typeof projectSummary.importantScripts === 'object' ?
        projectSummary.importantScripts : {};
    const scriptLines = Object.keys(importantScripts).length ?
        Object.entries(importantScripts).map(([name, command]) => `${name}: ${command}`).join('\n') :
        'No relevant scripts available';

    const availableScripts = Object.keys(importantScripts);
    const sectionGuidance = [
        projectSummary.packageJsonAvailable ? `- Installation: include \`${projectSummary.packageManager} install\`.` : '- Installation: omit because package.json was not found.',
        availableScripts.some(script => ['dev', 'start', 'preview'].includes(script)) ? '- Usage: include only the available development or start command.' : '- Usage: omit because no usage script was found.',
        availableScripts.includes('build') ? '- Build: include the available build command.' : '- Build: omit because no build script was found.',
        availableScripts.includes('test') ? '- Test: include the available test command.' : '- Test: omit because no test script was found.',
        availableScripts.some(script => ['dev', 'lint'].includes(script)) ? '- Development: include only available development or lint commands.' : '- Development: omit because no development workflow script was found.'
    ].join('\n');

    return `Generate a concise, professional README in Markdown format using only the project information below.

Strict rules:
- Use only the supplied data. Do not invent features, technologies, dependencies, commands, URLs, project details, or environment setup.
- Use the exact repository URL from the project summary.
- Do not write generic text such as "See documentation." in the Features section.
- Include a Features section only if features are explicitly supported by the supplied data; otherwise omit that section entirely or state that features could not be automatically determined.
- Use the section guidance below exactly; omit sections marked for omission.
- Use only the supplied scripts and do not invent commands.
- Present technologies as a short, readable list. Do not dump raw dependencies.
- Describe project structure only from the supplied root files and directories.
- If information is unavailable, omit it instead of guessing.
- Keep the README professional, factual, and concise.

Project Information:
- Name: ${projectSummary.name || 'Not provided'}
- Description: ${projectSummary.description || 'Not provided'}
- Repository URL: ${projectSummary.repository || 'Not provided'}
- Default Branch: ${projectSummary.defaultBranch || 'Not provided'}
- License: ${projectSummary.license || 'Not provided'}
- Programming Languages: ${languages.length ? languages.join(', ') : 'Not detected'}
- Frameworks/Tools: ${frameworks.length ? frameworks.join(', ') : 'Not detected'}
- Key Technologies: ${technologies.length ? technologies.join(', ') : 'Not detected'}
- Package Manager: ${projectSummary.packageJsonAvailable ? projectSummary.packageManager : 'Not available'}
- Important Files: ${importantFiles.length ? importantFiles.join(', ') : 'None detected'}
- Root Directories: ${Array.isArray(projectStructure.rootDirectories) && projectStructure.rootDirectories.length ? projectStructure.rootDirectories.join(', ') : 'None detected'}
- Root Files: ${Array.isArray(projectStructure.rootFiles) && projectStructure.rootFiles.length ? projectStructure.rootFiles.join(', ') : 'None detected'}
- Important Scripts:
${scriptLines}

Section guidance:
${sectionGuidance}

Generate a README with these sections when supported by the data:
1. Project Title
2. Overview
3. Features (only if explicit; otherwise omit)
4. Technologies Used
5. Installation (only when supported)
6. Usage (only when supported)
7. Build, Test, and Development (only when supported)
8. Contributing (only if general contribution guidance is supported by the project data)
9. License

Format the output as clean Markdown with proper headings, lists, and links where relevant. Do not include unsupported claims or generic placeholders.`;
}

// Define a GET endpoint for /api/health
// This endpoint returns a simple JSON response indicating the server is running
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Define a POST endpoint for /api/analyze
// This endpoint accepts a GitHub repository URL, validates it, fetches repository metadata from GitHub API,
// and returns extracted repository information
app.post('/api/analyze', async(req, res) => {
    // Extract repoUrl from the request body
    const { repoUrl } = req.body || {};

    // Validate that repoUrl is provided
    if (!repoUrl) {
        return res.status(400).json({
            error: 'Missing repoUrl',
            message: 'repoUrl is required in the request body'
        });
    }

    // Regular expression to match GitHub repository URLs
    // Matches: https://github.com/{owner}/{repo} or https://github.com/{owner}/{repo}.git
    const githubRegex = /^https:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+?)(\.git)?$/;
    const match = repoUrl.match(githubRegex);

    // Validate that the URL matches the GitHub format
    if (!match) {
        return res.status(400).json({
            error: 'Invalid GitHub URL',
            message: 'URL must be in format: https://github.com/{owner}/{repo}',
            receivedUrl: repoUrl
        });
    }

    // Extract owner and repository name from the regex match groups
    // match[1] = owner, match[2] = repo
    const owner = match[1];
    const repo = match[2];

    try {
        // Make a GET request to the GitHub API to fetch repository metadata
        // The GitHub API endpoint: https://api.github.com/repos/{owner}/{repo}
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: getGitHubHeaders()
        });
        const data = response.data;

        // Extract the specific fields needed from the GitHub API response
        const repoInfo = {
            name: data.name, // Repository name
            full_name: data.full_name, // Full name (owner/repo)
            description: data.description, // Repository description
            language: data.language, // Primary programming language
            default_branch: data.default_branch, // Default branch (main/master)
            stargazers_count: data.stargazers_count, // Number of stars
            license: data.license ? data.license.name : null, // License name if available
            owner,
            repo,
            languages: [], // Initialize empty languages array; will be populated from languages endpoint
            importantFiles: [], // Initialize empty importantFiles array; will be populated from contents endpoint
            packageInfo: null // Initialize packageInfo as null; will be populated if package.json exists
        };

        // Make a second GET request to fetch the languages used in the repository
        // The GitHub API endpoint: https://api.github.com/repos/{owner}/{repo}/languages
        // This endpoint returns an object with language names as keys and bytes as values
        try {
            const languagesResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`, {
                headers: getGitHubHeaders()
            });
            // Extract language names (keys) from the response object
            // Example response: { "JavaScript": 1234, "Python": 567 } becomes ["JavaScript", "Python"]
            repoInfo.languages = Object.keys(languagesResponse.data);
        } catch (languagesError) {
            // If languages endpoint fails, log it but continue with empty languages array
            // This ensures the endpoint still returns useful data even if languages fetch fails
            console.warn(`Failed to fetch languages for ${owner}/${repo}:`, languagesError.message);
            // repoInfo.languages remains as empty array initialized above
        }

        // Make a third GET request to fetch the root-level file and directory listing
        // The GitHub API endpoint: https://api.github.com/repos/{owner}/{repo}/contents
        // This endpoint returns an array of objects representing files and directories in the root
        try {
            const contentsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`, {
                headers: getGitHubHeaders()
            });
            const contentsData = Array.isArray(contentsResponse.data) ? contentsResponse.data : [];

            console.log(`[analyze] root contents fetched for ${owner}/${repo}: ${contentsData.length} items`);

            repoInfo.projectStructure = buildProjectStructure(contentsData);
            repoInfo.importantFiles = getImportantFiles(contentsData);

            console.log(`[analyze] package-related files for ${owner}/${repo}:`, repoInfo.importantFiles);
        } catch (contentsError) {
            // If contents endpoint fails, log it but continue with empty importantFiles array
            // This ensures the endpoint still returns useful data even if contents fetch fails
            console.warn(`Failed to fetch contents for ${owner}/${repo}:`, contentsError.message);
            // repoInfo.importantFiles remains as empty array initialized above
        }

        // Make a fourth GET request to fetch package.json file content if it exists
        // Only attempt to fetch if package.json was found in the importantFiles array
        if (repoInfo.importantFiles.includes('package.json')) {
            try {
                const packageJsonResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, {
                    headers: getGitHubHeaders()
                });
                const content =
                    packageJsonResponse &&
                    packageJsonResponse.data &&
                    packageJsonResponse.data.content;
                if (!content) {
                    repoInfo.packageInfo = {
                        name: null,
                        dependencies: {},
                        devDependencies: {},
                        scripts: {}
                    };
                    repoInfo.dependencies = [];
                } else {
                    try {
                        const decodedContent = Buffer
                            .from(content.replace(/\s/g, ''), 'base64')
                            .toString('utf8');

                        const packageJson = JSON.parse(decodedContent);

                        const dependencies = packageJson.dependencies || {};
                        const devDependencies = packageJson.devDependencies || {};

                        const allDependencies = [...new Set([
                            ...Object.keys(dependencies),
                            ...Object.keys(devDependencies)
                        ])];

                        repoInfo.packageInfo = {
                            name: packageJson.name || null,
                            dependencies,
                            devDependencies,
                            scripts: packageJson.scripts || {}
                        };

                        repoInfo.dependencies = allDependencies;

                    } catch (decodeError) {
                        console.error(
                            `Failed to decode or parse package.json for ${owner}/${repo}:`,
                            decodeError.message
                        );

                        repoInfo.packageInfo = {
                            name: null,
                            dependencies: {},
                            devDependencies: {},
                            scripts: {}
                        };

                        repoInfo.dependencies = [];
                    }
                }

            } catch (packageJsonError) {
                console.error(`Failed to fetch package.json for ${owner}/${repo}:`, packageJsonError.message);
                repoInfo.packageInfo = {
                    name: null,
                    dependencies: {},
                    devDependencies: {},
                    scripts: {}
                };
                repoInfo.dependencies = [];
            }
        } else {
            repoInfo.packageInfo = {
                name: null,
                dependencies: {},
                devDependencies: {},
                scripts: {}
            };
            repoInfo.dependencies = [];
        }

        // Transform the collected repository data into a standardized project summary
        const projectSummary = buildProjectSummary(repoInfo);

        // Return the standardized project summary as JSON
        res.json(projectSummary);

    } catch (error) {
        // Handle different types of errors from the GitHub API

        // If the repository doesn't exist, GitHub API returns 404
        if (error.response && error.response.status === 404) {
            return res.status(404).json({
                error: 'Repository not found',
                message: `The repository ${owner}/${repo} does not exist on GitHub`,
                owner,
                repo
            });
        }

        // If GitHub rejects the token or credentials are invalid, inform the user clearly.
        if (error.response && error.response.status === 401) {
            return res.status(401).json({
                error: 'GitHub authentication failed',
                message: 'GitHub authentication failed. Check the backend GITHUB_TOKEN or use an unauthenticated request for public repositories.'
            });
        }

        // If rate limited (403), inform the user.
        if (error.response && error.response.status === 403) {
            return res.status(403).json({
                error: 'Rate limited',
                message: 'GitHub API rate limit exceeded. Please try again later or add a valid GITHUB_TOKEN to the backend environment.'
            });
        }

        // Handle other API errors
        if (error.response) {
            return res.status(error.response.status).json({
                error: 'GitHub API error',
                message: error.response.statusText || 'An error occurred while fetching repository data'
            });
        }

        // Handle network or other errors
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch repository data. Please try again later.'
        });
    }
});

// Define a POST endpoint for /api/generate
// This endpoint accepts a project summary, generates a README using Gemini AI, and returns it as Markdown
app.post('/api/generate', async(req, res) => {
    // Extract projectSummary from the request body
    const { projectSummary } = req.body || {};

    // Validate that projectSummary is provided
    if (!projectSummary) {
        return res.status(400).json({
            error: 'Missing projectSummary',
            message: 'projectSummary is required in the request body'
        });
    }

    // Validate that the Gemini API key is configured
    if (!geminiClient) {
        return res.status(500).json({
            error: 'Gemini API not configured',
            message: 'GEMINI_API_KEY is not set in environment variables'
        });
    }

    try {
        // Build a detailed prompt for Gemini to generate a professional README
        const prompt = buildReadmePrompt(projectSummary);

        // Call the Gemini Interactions API to generate README content
        // Using the current gemini-3.6-flash model with the Interactions APIGitHub Copilot: Disable Completions
        // This API is optimized for single-turn text generation tasks
        const interaction = await geminiClient.interactions.create({
            model: 'gemini-3.6-flash',
            input: prompt
        });

        // Extract the generated text from the Interactions API response
        const generatedReadme = interaction.output_text || '';

        // Validate that content was generated
        if (!generatedReadme) {
            return res.status(500).json({
                error: 'Empty response from Gemini',
                message: 'Gemini API returned an empty response'
            });
        }

        // Return the generated README as JSON
        res.json({
            readme: generatedReadme
        });

    } catch (error) {
        // Handle Gemini API errors
        console.error('Gemini API error:', error.message);

        // Check for specific API errors
        if (error.message && error.message.includes('API key')) {
            return res.status(401).json({
                error: 'Gemini authentication failed',
                message: 'Invalid or expired API key'
            });
        }

        if (error.message && error.message.includes('quota')) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Gemini API rate limit has been exceeded. Please try again later.'
            });
        }

        // Handle other API errors
        res.status(500).json({
            error: 'Gemini API error',
            message: error.message || 'Failed to generate README. Please try again later.'
        });
    }
});

// Define a POST endpoint for /api/download
// This endpoint accepts generated README markdown in memory and triggers a browser download
app.post('/api/download', (req, res) => {
    const { readme } = req.body || {};

    if (typeof readme !== 'string' || readme.trim().length === 0) {
        return res.status(400).json({
            error: 'Invalid readme',
            message: 'readme must be a non-empty string'
        });
    }

    try {
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename="README.md"');
        return res.send(readme);
    } catch (error) {
        console.error('README download error:', error);
        return res.status(500).json({
            error: 'Download failed',
            message: 'An unexpected error occurred while preparing the README for download'
        });
    }
});

// Set the server to listen on port 5000
// Once started, the server will accept incoming requests on this port
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});