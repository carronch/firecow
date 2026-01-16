import fs from 'node:fs';
import path from 'node:path';

// Get arguments
const args = process.argv.slice(2);
const siteName = args[0];

if (!siteName) {
    console.error('❌ Please provide a site name.');
    console.error('Usage: pnpm create-cloud-project <site-name>');
    process.exit(1);
}

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('❌ Missing Cloudflare Credentials.');
    console.error('Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.');
    process.exit(1);
}

// Configuration
const REPO_OWNER = 'carronch';
const REPO_NAME = 'firecow';
const BRANCH = 'main';

async function createProject() {
    console.log(`🚀 Creating Cloudflare Pages project for: ${siteName}...`);

    const projectName = siteName.replace('@firecow/', ''); // Ensure clean name if scoped

    // https://developers.cloudflare.com/api/operations/pages-project-create-project
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects`;

    const payload = {
        name: projectName,
        source: {
            type: 'github',
            config: {
                owner: REPO_OWNER,
                repo_name: REPO_NAME,
                production_branch: BRANCH,
                pr_comments_enabled: true,
                deployments_enabled: true
            }
        },
        build_config: {
            build_command: `npx turbo run build --filter=@firecow/${siteName}`,
            destination_dir: `apps/${siteName}/dist`,
            root_dir: '' // Monorepo root
        },
        deployment_configs: {
            production: {
                compatibility_date: '2024-01-01',
                compatibility_flags: ['nodejs_compat']
            },
            preview: {
                compatibility_date: '2024-01-01',
                compatibility_flags: ['nodejs_compat']
            }
        },
        canonical_deployment: { // Optional: configures the production deployment
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            console.log(`✅ Project "${projectName}" created successfully!`);
            console.log(`🔗 Dashboard: https://dash.cloudflare.com/${CLOUDFLARE_ACCOUNT_ID}/pages/view/${projectName}`);
            console.log(`\n⚠️  ACTION REQUIRED:`);
            console.log(`1. Go to the dashboard link above.`);
            console.log(`2. Go to Settings > Environment Variables.`);
            console.log(`3. Add KEYSTATIC_GITHUB_CLIENT_ID and KEYSTATIC_GITHUB_CLIENT_SECRET.`);
        } else {
            console.error('❌ Failed to create project:', JSON.stringify(data.errors, null, 2));
        }

    } catch (error) {
        console.error('❌ Network or Script Error:', error);
    }
}

createProject();
