type Repo = {
  id: number
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
  updated_at: string
  fork: boolean
  topics: string[]
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-100 text-blue-600',
  JavaScript: 'bg-yellow-100 text-yellow-600',
  Python: 'bg-green-100 text-green-600',
  Rust: 'bg-orange-100 text-orange-600',
  Go: 'bg-cyan-100 text-cyan-600',
  Java: 'bg-red-100 text-red-600',
  'C++': 'bg-purple-100 text-purple-600',
  CSS: 'bg-pink-100 text-pink-600',
  HTML: 'bg-rose-100 text-rose-600',
}

async function fetchRepos(username: string): Promise<Repo[]> {
  if (!username) return []
  try {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=20&type=owner`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data: Repo[] = await res.json()
    return data.filter(r => !r.fork)
  } catch {
    return []
  }
}

export default async function ProjectsPage() {
  const user1 = process.env.GITHUB_USERNAME_1 || ''
  const user2 = process.env.GITHUB_USERNAME_2 || ''

  const [repos1, repos2] = await Promise.all([fetchRepos(user1), fetchRepos(user2)])

  const seen = new Set<number>()
  const allRepos = [...repos1, ...repos2]
    .filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  const notConfigured = !user1 && !user2

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-800">Projects 💻</h1>
        <p className="text-stone-400 mt-1 text-sm">our computer science projects on GitHub</p>
      </div>

      {notConfigured ? (
        <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center max-w-md">
          <p className="text-3xl mb-3">💻</p>
          <h2 className="font-medium text-stone-700 mb-2">Set up your GitHub usernames</h2>
          <p className="text-stone-400 text-sm mb-4">
            Add your GitHub usernames to{' '}
            <code className="bg-rose-50 px-1 rounded text-xs">.env.local</code> to show your
            projects here.
          </p>
          <pre className="text-left bg-stone-50 rounded-xl p-4 text-xs text-stone-500 border border-stone-100">
            {`GITHUB_USERNAME_1=your-username\nGITHUB_USERNAME_2=partner-username`}
          </pre>
        </div>
      ) : allRepos.length === 0 ? (
        <div className="text-center py-12 text-stone-300">
          <p className="text-4xl mb-3">💻</p>
          <p className="text-sm">no public repos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allRepos.map(repo => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-rose-100 p-5 flex flex-col gap-3 hover:border-rose-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-stone-700 text-sm group-hover:text-rose-500 transition-colors leading-tight">
                  {repo.name}
                </p>
                <span className="text-stone-300 text-xs shrink-0">↗</span>
              </div>

              {repo.description && (
                <p className="text-stone-400 text-xs leading-relaxed line-clamp-2">
                  {repo.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-auto flex-wrap">
                {repo.language && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${LANG_COLORS[repo.language] || 'bg-stone-100 text-stone-500'}`}
                  >
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && (
                  <span className="text-xs text-stone-400">⭐ {repo.stargazers_count}</span>
                )}
                <span className="text-xs text-stone-300 ml-auto">
                  {new Date(repo.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
