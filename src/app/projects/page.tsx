type Repo = {
  id: number; name: string; description: string | null
  html_url: string; stargazers_count: number; language: string | null
  updated_at: string; fork: boolean; topics: string[]
}

const LANG_COLORS: Record<string, string> = {
  TypeScript:  'bg-blue-50 text-blue-600',
  JavaScript:  'bg-yellow-50 text-yellow-600',
  Python:      'bg-green-50 text-green-700',
  Rust:        'bg-orange-50 text-orange-600',
  Go:          'bg-cyan-50 text-cyan-700',
  Java:        'bg-red-50 text-red-600',
  'C++':       'bg-purple-50 text-purple-600',
  CSS:         'bg-pink-50 text-pink-600',
  HTML:        'bg-rose-50 text-rose-500',
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
  } catch { return [] }
}

export default async function ProjectsPage() {
  const user1 = process.env.GITHUB_USERNAME_1 || ''
  const user2 = process.env.GITHUB_USERNAME_2 || ''

  const [repos1, repos2] = await Promise.all([fetchRepos(user1), fetchRepos(user2)])

  const seen = new Set<number>()
  const allRepos = [...repos1, ...repos2]
    .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  const notConfigured = !user1 && !user2

  return (
    <div className="p-6 md:p-10 pt-20">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/70 mb-1">code</p>
        <h1 className="text-3xl font-semibold text-[#2C1A0E]">Projects 💻</h1>
        <p className="text-[#7A6155] mt-1 text-sm">our computer science projects on GitHub</p>
      </div>

      {notConfigured ? (
        <div className="bg-white rounded-2xl border border-[#E8DDD4] p-8 text-center max-w-md" style={{ boxShadow: '0 2px 16px rgba(44,26,14,0.06)' }}>
          <p className="text-3xl mb-3">💻</p>
          <h2 className="font-medium text-[#2C1A0E] mb-2">Set up your GitHub usernames</h2>
          <p className="text-[#7A6155] text-sm mb-4">
            Add your GitHub usernames to{' '}
            <code className="bg-[#F5EFE8] px-1.5 py-0.5 rounded text-xs text-[#7A6155]">.env.local</code> to show your projects here.
          </p>
          <pre className="text-left bg-[#F5EFE8] rounded-xl p-4 text-xs text-[#7A6155] border border-[#E8DDD4]">
            {`GITHUB_USERNAME_1=your-username\nGITHUB_USERNAME_2=partner-username`}
          </pre>
        </div>
      ) : allRepos.length === 0 ? (
        <div className="text-center py-12 text-[#AE9B8E]">
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
              className="bg-white rounded-2xl border border-[#E8DDD4] p-5 flex flex-col gap-3 hover:border-[#C4784A]/30 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(196,120,74,0.1)] transition-all group"
              style={{ boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-[#2C1A0E] text-sm group-hover:text-[#C4784A] transition-colors leading-tight">{repo.name}</p>
                <span className="text-[#AE9B8E] text-xs shrink-0">↗</span>
              </div>
              {repo.description && (
                <p className="text-[#7A6155] text-xs leading-relaxed line-clamp-2">{repo.description}</p>
              )}
              <div className="flex items-center gap-2 mt-auto flex-wrap">
                {repo.language && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LANG_COLORS[repo.language] || 'bg-[#F5EFE8] text-[#7A6155]'}`}>
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && <span className="text-xs text-[#AE9B8E]">⭐ {repo.stargazers_count}</span>}
                <span className="text-xs text-[#AE9B8E] ml-auto">
                  {new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
