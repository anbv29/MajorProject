const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf-8');

// Replace the end of the file.
const endBlockPattern = /          <\/div>\r?\n                \)}\r?\n      <\/main>/;

const newEndBlock = `          </div>
          </div>
        )}
      </main>`;

code = code.replace(endBlockPattern, newEndBlock);

fs.writeFileSync('src/App.jsx', code, 'utf-8');
console.log("Fixed EOF");
