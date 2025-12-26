#!/usr/bin/env node

/**
 * Property-Based Test Runner Script
 * 
 * This script runs property-based tests and generates comprehensive reports.
 * Usage: node scripts/run-property-tests.js [options]
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const config = {
  testPattern: 'src/lib/testing/**/*.test.{ts,tsx}',
  outputDir: 'test-reports',
  reportFormats: ['console', 'json', 'html'],
  verbose: false
}

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  format: 'console',
  output: null,
  pattern: config.testPattern,
  verbose: false,
  help: false
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  switch (arg) {
    case '--format':
    case '-f':
      options.format = args[++i]
      break
    case '--output':
    case '-o':
      options.output = args[++i]
      break
    case '--pattern':
    case '-p':
      options.pattern = args[++i]
      break
    case '--verbose':
    case '-v':
      options.verbose = true
      break
    case '--help':
    case '-h':
      options.help = true
      break
  }
}

if (options.help) {
  console.log(`
Property-Based Test Runner

Usage: node scripts/run-property-tests.js [options]

Options:
  -f, --format <format>    Report format: console, json, html (default: console)
  -o, --output <file>      Output file path (default: stdout for console, auto-generated for others)
  -p, --pattern <pattern>  Test file pattern (default: ${config.testPattern})
  -v, --verbose           Verbose output
  -h, --help              Show this help message

Examples:
  node scripts/run-property-tests.js
  node scripts/run-property-tests.js --format json --output reports/pbt-results.json
  node scripts/run-property-tests.js --format html --output reports/pbt-report.html
  `)
  process.exit(0)
}

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true })
}

console.log('🧪 Running Property-Based Tests...\n')

try {
  // Run the tests
  const testCommand = `npm run test:run -- ${options.pattern} ${options.verbose ? '--reporter=verbose' : ''}`
  
  if (options.verbose) {
    console.log(`Executing: ${testCommand}`)
  }
  
  const testOutput = execSync(testCommand, { 
    encoding: 'utf8',
    stdio: options.verbose ? 'inherit' : 'pipe'
  })
  
  if (!options.verbose) {
    console.log(testOutput)
  }
  
  console.log('✅ Property-based tests completed successfully!')
  
  // Generate reports if requested
  if (options.format !== 'console' || options.output) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const defaultOutput = options.output || path.join(
      config.outputDir, 
      `pbt-report-${timestamp}.${options.format === 'html' ? 'html' : 'json'}`
    )
    
    console.log(`\n📊 Generating ${options.format} report: ${defaultOutput}`)
    
    // Note: In a real implementation, this would import and use the test analysis module
    // For now, we'll create a placeholder report
    const reportContent = generatePlaceholderReport(options.format, timestamp)
    
    fs.writeFileSync(defaultOutput, reportContent)
    console.log(`✅ Report saved to: ${defaultOutput}`)
  }
  
} catch (error) {
  console.error('❌ Property-based tests failed:')
  console.error(error.message)
  
  if (options.verbose) {
    console.error(error.stdout)
    console.error(error.stderr)
  }
  
  process.exit(1)
}

function generatePlaceholderReport(format, timestamp) {
  const data = {
    timestamp,
    summary: 'Property-based tests completed',
    note: 'This is a placeholder report. In a full implementation, this would contain detailed test analysis.'
  }
  
  if (format === 'html') {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Property-Based Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Property-Based Test Report</h1>
        <p>Generated on ${new Date(timestamp).toLocaleString()}</p>
        <p>${data.summary}</p>
        <p><em>${data.note}</em></p>
    </div>
</body>
</html>
    `
  } else {
    return JSON.stringify(data, null, 2)
  }
}

console.log('\n🎉 Property-based testing framework setup complete!')
console.log('\nNext steps:')
console.log('1. Run tests: npm run test')
console.log('2. Run only property tests: npm run test src/lib/testing')
console.log('3. Generate reports: node scripts/run-property-tests.js --format html')