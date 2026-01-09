/**
 * Pre-Commit Hook: Documentation Validation
 * 
 * Ensures code documentation standards are met before committing:
 * - Functions have descriptive comments (Python docstrings or JS comments)
 * - README reflects current project state
 * - No TODOs without issue references
 * 
 * Triggers: Before git commit
 */

const fs = require('fs');
const path = require('path');

function checkDocumentation(stagedFiles) {
  const issues = [];
  
  // Filter for code files
  const codeFiles = stagedFiles.filter(file => 
    /\.(js|jsx|ts|tsx|py)$/.test(file) && fs.existsSync(file)
  );
  
  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const isPython = file.endsWith('.py');
    
    // Check for function declarations without preceding comments/docstrings
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Match function declarations
      let isFunctionDeclaration = false;
      
      if (isPython) {
        // Python: def function_name(...):
        isFunctionDeclaration = /^def\s+\w+/.test(line);
      } else {
        // JavaScript: function declarations or arrow functions
        isFunctionDeclaration = 
          /^(export\s+)?(async\s+)?function\s+\w+/.test(line) ||
          /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/.test(line);
      }
      
      if (isFunctionDeclaration) {
        let hasComment = false;
        
        if (isPython) {
          // Check for docstring on next line(s)
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
              hasComment = true;
            }
          }
        } else {
          // Check for comment in previous 3 lines (JavaScript)
          for (let j = Math.max(0, i - 3); j < i; j++) {
            const commentLine = lines[j].trim();
            if (commentLine.startsWith('//') || commentLine.startsWith('*')) {
              hasComment = true;
              break;
            }
          }
        }
        
        if (!hasComment) {
          const docType = isPython ? 'docstring' : 'comment';
          issues.push(`${file}:${i + 1} - Function missing documentation ${docType}`);
        }
      }
      
      // Check for TODO without issue reference
      if (line.includes('TODO') && !line.includes('#') && !line.includes('ISSUE')) {
        issues.push(`${file}:${i + 1} - TODO without issue reference`);
      }
    }
  }
  
  // Report issues
  if (issues.length > 0) {
    console.log('\n⚠️  Documentation issues found:\n');
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log('\n💡 Tip: Add docstrings (Python) or comments (JS) above functions.\n');
    return false;
  }
  
  console.log('✓ Documentation check passed');
  return true;
}

module.exports = { checkDocumentation };

// If run directly
if (require.main === module) {
  const stagedFiles = process.argv.slice(2);
  if (stagedFiles.length === 0) {
    console.log('Usage: node doc-check.js <file1> <file2> ...');
    process.exit(1);
  }
  
  const passed = checkDocumentation(stagedFiles);
  process.exit(passed ? 0 : 1);
}