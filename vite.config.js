import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages base path only applies to production builds, not local dev
export default defineConfig(({ command }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
  const isGithubPages = process.env.GITHUB_PAGES === 'true'
  const base = command === 'build' && isGithubPages && repoName ? `/${repoName}/` : '/'

  return {
    base,
    plugins: [react()],
    css: {
      postcss: {},
    },
  }
})
