const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf-8');

const targetStr = `            <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">`;
              
const replacementStr = `            <div className="mb-6 flex items-center justify-between">
            <div>
              <button 
                onClick={() => setViewMode("dashboard")} 
                className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-500 hover:text-emerald-400 hover:-translate-x-1 transition-all"
              >
                ← Back to Dashboard
              </button>
              <div className="flex items-center gap-2">`;
              
// Using simple split-join since line endings might differ (normalize first)
code = code.replace(/\r\n/g, '\n');
const fixedTarget = targetStr.replace(/\r\n/g, '\n');
const fixedReplacement = replacementStr.replace(/\r\n/g, '\n');

code = code.split(fixedTarget).join(fixedReplacement);

fs.writeFileSync('src/App.jsx', code, 'utf-8');
console.log("Button injected!");
