type Repo = {
  id: number; name: string; description: string | null
  html_url: string; stargazers_count: number; language: string | null
  updated_at: string; fork: boolean; topics: string[]
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'rgba(59,130,246,0.2) text-blue-300',
  JavaScript: 'rgba(234,179,8,0.2) text-yellow-300',
  Python: 'rgba(34,197,94,0.2) text-green-300',
  Rust: 'rgba(249,115,22,0.2) text-orange-300',
  Go: 'rgba(6,182,212,0.2) text-cyan-300',
  Java: 'rgba(239,68,68,0.2) text-red-300',
  'C++': 'rgba(168,85,247,0.2) text-purple-300',
  CSS: 'rgba(236,72,153,0.2) text-pink-300',
  HTML: 'rgba(200,169,126,0.2) text-[#c8a97e]',
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
  const cardStyle = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }

  return (
    <div className="pt-20 p-6 md:p-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#c8a97e]/60 mb-1">our work</p>
        <h1 className="text-3xl font-light text-white" >Projects</h1>
        <p className="text-white/35 mt-1 text-sm">our computer science projects on GitHub</p>
      </div>

      {notConfigured ? (
        <div className="rounded-2xl border border-white/[0.08] p-8 text-center max-w-md" style={cardStyle}>
          <p className="text-3xl mb-3">💻</p>
          <h2 className="text-white/70 font-medium mb-2">Set up your GitHub usernames</h2>
          <p className="text-white/35 text-sm mb-4">Add your GitHub usernames to <code className="text-white/25 text-xs">.env.local</code></p>
          <pre className="text-left rounded-xl p-4 text-xs text-white/30 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {`GITHUB_USERNAME_1=your-username\nGITHUB_USERNAME_2=partner-username`}
          </pre>
        </div>
      ) : allRepos.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <p className="text-4xl mb-3">💻</p>
          <p className="text-sm">no public repos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allRepos.map(repo => {
            const langClass = repo.language ? (LANG_COLORS[repo.language] || 'rgba(255,255,255,0.08) text-white/50') : ''
            const [langBg, langText] = langClass.split(' ')
            return (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-3 hover:border-[#c8a97e]/30 transition-all group"
                style={cardStyle}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white/75 group-hover:text-[#c8a97e] transition-colors font-medium leading-tight">{repo.name}</p>
                  <span className="text-white/20 text-xs shrink-0 group-hover:text-white/40 transition-colors">↗</span>
                </div>
                {repo.description && <p className="text-white/35 text-xs leading-relaxed line-clamp-2">{repo.description}</p>}
                <div className="flex items-center gap-2 mt-auto flex-wrap">
                  {repo.language && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${langText}`} style={{ background: langBg }}>{repo.language}</span>
                  )}
                  {repo.stargazers_count > 0 && <span className="text-xs text-white/25">⭐ {repo.stargazers_count}</span>}
                  <span className="text-xs text-white/20 ml-auto">
                    {new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
