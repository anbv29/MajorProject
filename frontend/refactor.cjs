const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Broad Color Replacements
const colorMap = {
    "violet-500": "emerald-500",
    "violet-400": "emerald-400",
    "violet-300": "emerald-300",
    "violet-200": "emerald-200",
    "violet-100": "emerald-100",
    "fuchsia-500": "green-500",
    "fuchsia-400": "green-400",
    "fuchsia-300": "green-300",
    "indigo-500": "emerald-600",
    "indigo-600": "emerald-700",
    "indigo-400": "emerald-500",
    "indigo-300": "emerald-400",
    "indigo-200": "emerald-300",
    "teal-500": "lime-500",
    "teal-400": "lime-400",
    "teal-300": "lime-300",
    "teal-200": "lime-200",
    "rose-500": "emerald-500",
    "rose-400": "emerald-400",
    "rose-300": "emerald-300",
    "bg-[#030712]": "bg-[#000000]"
};

for (const [oldC, newC] of Object.entries(colorMap)) {
    code = code.split(oldC).join(newC);
}

// 2. Add ViewMode state
const stateBlock = '  const [activeTab, setActiveTab] = useState("plume");';
const newStateBlock = '  const [activeTab, setActiveTab] = useState("plume");\n  const [viewMode, setViewMode] = useState("dashboard");';
code = code.replace(stateBlock, newStateBlock);


// 3. Restructure layout from Left-Sidebar to Top-Navbar & Grid
// We want to replace everything from the <div className="flex"> to the start of the active tab logic
const layoutMatchPattern = /(return\s*\(\s*<div className="relative min-h-screen overflow-hidden bg-\[#000000\] text-white font-\['Outfit'\]">\s*<div className="pointer-events-none absolute[^\n]*\n\s*<div className="pointer-events-none absolute[^\n]*\n\s*<div className="flex">\s*<aside[\s\S]*?<\/aside>\s*<main[^>]*>\s*<div className="mb-6 flex items-center justify-between">)/;

const newLayout = `return (
    <div className="relative min-h-screen overflow-hidden bg-[#000000] text-zinc-200 font-['Outfit']">
      <div className="pointer-events-none fixed left-[10%] top-[-10%] h-[500px] w-[500px] animate-pulse-glow rounded-full bg-emerald-600/10 blur-[100px] duration-1000" />
      <div className="pointer-events-none fixed right-[5%] bottom-[-10%] h-[400px] w-[400px] animate-pulse-glow rounded-full bg-green-500/10 blur-[100px] delay-500 duration-1000" />

      {/* Top Navbar */}
      <header className="relative z-50 flex items-center justify-between border-b border-white/5 bg-black/60 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">CP</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">ChemE Process Suite</h1>
            <p className="text-xs text-zinc-400">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <p className={\`text-sm font-bold \${rank.color}\`}>{rank.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: \`\${progressPercent}%\` }} />
              </div>
              <p className="text-[10px] text-zinc-400">{xp} / {nextRankXp} XP</p>
            </div>
          </div>
          <button onClick={logout} className="rounded-lg bg-white/5 p-2 text-zinc-400 hover:bg-white/10 hover:text-emerald-400 transition-all">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10 h-[calc(100vh-80px)] overflow-y-auto">
        {viewMode === "dashboard" ? (
          <div className="animate-fade-in-up">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-bold text-white tracking-tight">Select a Simulation</h2>
              <p className="mt-2 text-zinc-400">Choose a process module below to open a focused workspace.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setViewMode("workspace"); }}
                    className="group relative flex flex-col items-start gap-4 rounded-3xl border border-white/5 bg-zinc-900/40 p-8 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-zinc-800/80 hover:shadow-[0_0_35px_rgba(16,185,129,0.15)]"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/50 text-emerald-400 transition-colors group-hover:bg-emerald-500/20 group-hover:text-emerald-300 ring-1 ring-white/5">
                      <Icon size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-100">{tab.label}</h3>
                      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{moduleDetails[tab.id]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up pb-20">
            <div className="mb-6 flex items-center justify-between">`;

code = code.replace(layoutMatchPattern, newLayout);

// 4. Inject Back to Dashboard Button near "Backend Online"
// We find `<div className="flex flex-wrap items-center justify-end gap-2">` which is in the header of the workspace view,
// But we actually need to put the Back button above the title.
const titleMatch = `            <div className="mb-6 flex items-center justify-between">\n              <div>\n                <div className="flex items-center gap-2">`;
const newTitleMatch = `              <div>\n                <button onClick={() => setViewMode("dashboard")} className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-500 hover:text-emerald-400 hover:-translate-x-1 transition-all">\n                   ← Back to Dashboard\n                </button>\n                <div className="flex items-center gap-2">`;
code = code.replace(`              <div>\n                <div className="flex items-center gap-2">`, newTitleMatch);


// 5. Close the tags properly.
const footerMatch = /<\/main>\s*<\/div>\s*<\/div>\s*\);/g;
const newFooter = `        )}
      </main>
    </div>
  );`;
code = code.replace(footerMatch, newFooter);

fs.writeFileSync('src/App.jsx', code, 'utf-8');
console.log("Transformation successful!");
