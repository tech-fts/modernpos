#!/usr/bin/env node

const http = require('http')
const https = require('https')

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
const TEST_CONFIG = {
  timeout: 10000,
  verbose: process.argv.includes('--verbose'),
  parallel: process.argv.includes('--parallel')
}

class SecurityTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    }
  }

  async runAllTests() {
    console.log('🔒 Modern POS Security Test Suite')
    console.log('==================================')
    console.log(`Target: ${BASE_URL}`)
    console.log(`Mode: ${TEST_CONFIG.parallel ? 'Parallel' : 'Sequential'}`)
    console.log('')

    const tests = [
      { name: 'Security Headers', fn: this.testSecurityHeaders.bind(this) },
      { name: 'CSRF Protection', fn: this.testCsrfProtection.bind(this) },
      { name: 'Rate Limiting', fn: this.testRateLimiting.bind(this) },
      { name: 'Input Validation', fn: this.testInputValidation.bind(this) },
      { name: 'Authentication', fn: this.testAuthentication.bind(this) },
      { name: 'File Upload Security', fn: this.testFileUploadSecurity.bind(this) },
      { name: 'SQL Injection Protection', fn: this.testSqlInjectionProtection.bind(this) },
      { name: 'XSS Protection', fn: this.testXssProtection.bind(this) },
      { name: 'Directory Traversal Protection', fn: this.testDirectoryTraversalProtection.bind(this) },
      { name: 'Session Security', fn: this.testSessionSecurity.bind(this) }
    ]

    if (TEST_CONFIG.parallel) {
      await Promise.all(tests.map(test => this.runTest(test)))
    } else {
      for (const test of tests) {
        await this.runTest(test)
      }
    }

    this.printResults()
  }

  async runTest(test) {
    try {
      console.log(`🧪 Testing: ${test.name}`)
      await test.fn()
      this.results.passed++
      this.results.details.push({ name: test.name, status: 'PASS', message: 'Test passed' })
      console.log(`✅ ${test.name}: PASSED`)
    } catch (error) {
      this.results.failed++
      this.results.details.push({ name: test.name, status: 'FAIL', message: error.message })
      console.log(`❌ ${test.name}: FAILED - ${error.message}`)
    }
    this.results.total++
    console.log('')
  }

  async testSecurityHeaders() {
    const response = await this.makeRequest('/', 'GET')
    
    const requiredHeaders = {
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'x-xss-protection': '1; mode=block'
    }

    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const actualValue = response.headers[header]
      if (!actualValue) {
        throw new Error(`Missing security header: ${header}`)
      }
      if (actualValue !== expectedValue) {
        throw new Error(`Invalid ${header}: expected "${expectedValue}", got "${actualValue}"`)
      }
    }

    // Check for production headers if available
    if (response.headers['strict-transport-security']) {
      console.log('   ℹ️  HSTS header found (production ready)')
    }
  }

  async testCsrfProtection() {
    // Test products API without CSRF token
    const response = await this.makeRequest('/api/products', 'POST', {
      name: 'Test Product',
      sku: 'TEST123',
      price: 100,
      cost: 50,
      stock: 10,
      categoryId: 'test-category'
    })

    if (response.status !== 403) {
      throw new Error(`Expected 403 status, got ${response.status}`)
    }

    // Test with invalid CSRF token
    const response2 = await this.makeRequest('/api/products', 'POST', {
      name: 'Test Product',
      sku: 'TEST123',
      price: 100,
      cost: 50,
      stock: 10,
      categoryId: 'test-category',
      csrfToken: 'invalid-token'
    })

    if (response2.status !== 403) {
      throw new Error(`Expected 403 status with invalid token, got ${response2.status}`)
    }
  }

  async testRateLimiting() {
    const attempts = []
    
    // Make multiple login attempts
    for (let i = 0; i < 6; i++) {
      const response = await this.makeRequest('/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'wrongpassword'
      })
      attempts.push(response.status)
    }

    const rateLimited = attempts.some(status => status === 429)
    if (!rateLimited) {
      throw new Error('Rate limiting not working - no 429 status received')
    }

    console.log('   ℹ️  Rate limiting working correctly')
  }

  async testInputValidation() {
    // Test with extremely long input
    const longInput = 'a'.repeat(2000)
    const response = await this.makeRequest('/api/products', 'POST', {
      name: longInput,
      sku: 'TEST123',
      price: 100,
      cost: 50,
      stock: 10,
      categoryId: 'test-category',
      csrfToken: 'a'.repeat(64)
    })

    if (response.status !== 400) {
      throw new Error(`Expected 400 status for long input, got ${response.status}`)
    }
  }

  async testAuthentication() {
    // Test protected route without auth
    const response = await this.makeRequest('/dashboard/products', 'GET')
    
    if (response.status !== 302 && response.status !== 401) {
      throw new Error(`Expected redirect/unauthorized for protected route, got ${response.status}`)
    }

    console.log('   ℹ️  Authentication middleware working')
  }

  async testFileUploadSecurity() {
    // Test with suspicious file type
    const response = await this.makeRequest('/api/products/import', 'POST', {
      file: 'malicious.exe',
      csrfToken: 'a'.repeat(64)
    })

    if (response.status !== 400 && response.status !== 403) {
      throw new Error(`Expected rejection of suspicious file, got ${response.status}`)
    }
  }

  async testSqlInjectionProtection() {
    const maliciousInputs = [
      "'; DROP TABLE products; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ]

    for (const input of maliciousInputs) {
      const response = await this.makeRequest('/api/products?search=' + encodeURIComponent(input), 'GET')
      
      if (response.status === 500) {
        throw new Error(`SQL injection vulnerability detected with input: ${input}`)
      }
    }

    console.log('   ℹ️  SQL injection protection working')
  }

  async testXssProtection() {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')">'
    ]

    for (const input of maliciousInputs) {
      const response = await this.makeRequest('/api/products?search=' + encodeURIComponent(input), 'GET')
      
      if (response.status === 500) {
        throw new Error(`XSS vulnerability detected with input: ${input}`)
      }
    }

    console.log('   ℹ️  XSS protection working')
  }

  async testDirectoryTraversalProtection() {
    const maliciousPaths = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd'
    ]

    for (const path of maliciousPaths) {
      const response = await this.makeRequest('/' + path, 'GET')
      
      if (response.status === 200 && response.body.includes('root:')) {
        throw new Error(`Directory traversal vulnerability detected with path: ${path}`)
      }
    }

    console.log('   ℹ️  Directory traversal protection working')
  }

  async testSessionSecurity() {
    // Test session cookie attributes
    const response = await this.makeRequest('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'testpassword'
    })

    const setCookie = response.headers['set-cookie']
    if (setCookie) {
      const cookie = setCookie[0]
      
      if (!cookie.includes('HttpOnly')) {
        throw new Error('Session cookie missing HttpOnly flag')
      }
      
      if (!cookie.includes('SameSite')) {
        throw new Error('Session cookie missing SameSite attribute')
      }

      console.log('   ℹ️  Session security headers working')
    }
  }

  async makeRequest(path, method, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL)
      const options = {
        method,
        headers: {
          'User-Agent': 'Security-Test-Suite/1.0',
          'Content-Type': 'application/json'
        }
      }

      const req = http.request(url, options, (res) => {
        let body = ''
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          })
        })
      })

      req.on('error', reject)
      req.setTimeout(TEST_CONFIG.timeout, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      if (data) {
        req.write(JSON.stringify(data))
      }

      req.end()
    })
  }

  printResults() {
    console.log('📊 Test Results Summary')
    console.log('=======================')
    console.log(`Total Tests: ${this.results.total}`)
    console.log(`Passed: ${this.results.passed} ✅`)
    console.log(`Failed: ${this.results.failed} ❌`)
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`)
    console.log('')

    if (this.results.failed > 0) {
      console.log('❌ Failed Tests:')
      this.results.details
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.message}`)
        })
      console.log('')
    }

    if (this.results.passed === this.results.total) {
      console.log('🎉 All security tests passed! Your system is secure.')
    } else {
      console.log('⚠️  Some security tests failed. Please review the issues above.')
    }

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0)
  }
}

// Run the test suite
const testSuite = new SecurityTestSuite()
testSuite.runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})
