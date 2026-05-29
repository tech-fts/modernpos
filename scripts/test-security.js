#!/usr/bin/env node

const https = require('https')
const http = require('http')

const BASE_URL = 'http://localhost:3002'

async function testSecurityFeatures() {
  console.log('🔒 Testing Modern POS Security Features')
  console.log('=====================================\n')

  // Test 1: Security Headers
  console.log('1. Testing Security Headers...')
  try {
    const response = await makeRequest(`${BASE_URL}/`, 'GET')
    const headers = response.headers
    
    const securityHeaders = {
      'X-Frame-Options': headers['x-frame-options'],
      'X-Content-Type-Options': headers['x-content-type-options'],
      'Referrer-Policy': headers['referrer-policy'],
      'Permissions-Policy': headers['permissions-policy'],
      'X-XSS-Protection': headers['x-xss-protection']
    }
    
    console.log('✅ Security Headers Found:')
    Object.entries(securityHeaders).forEach(([header, value]) => {
      if (value) {
        console.log(`   ${header}: ${value}`)
      }
    })
  } catch (error) {
    console.log('❌ Failed to test security headers:', error.message)
  }

  // Test 2: Rate Limiting (simulate multiple login attempts)
  console.log('\n2. Testing Rate Limiting...')
  try {
    const loginAttempts = []
    for (let i = 0; i < 6; i++) {
      const response = await makeRequest(`${BASE_URL}/api/auth/login`, 'POST', {
        email: 'test@example.com',
        password: 'wrongpassword'
      })
      loginAttempts.push(response.status)
    }
    
    const rateLimited = loginAttempts.some(status => status === 429)
    if (rateLimited) {
      console.log('✅ Rate limiting is working - 429 status received')
    } else {
      console.log('⚠️ Rate limiting may not be working properly')
    }
  } catch (error) {
    console.log('❌ Failed to test rate limiting:', error.message)
  }

  // Test 3: CSRF Protection
  console.log('\n3. Testing CSRF Protection...')
  try {
    // Try to create a product without CSRF token
    const response = await makeRequest(`${BASE_URL}/api/products`, 'POST', {
      name: 'Test Product',
      sku: 'TEST123',
      price: 100,
      cost: 50,
      stock: 10,
      categoryId: 'test-category'
    })
    
    if (response.status === 403) {
      console.log('✅ CSRF protection is working - 403 status received')
    } else {
      console.log('⚠️ CSRF protection may not be working properly')
    }
  } catch (error) {
    console.log('❌ Failed to test CSRF protection:', error.message)
  }

  // Test 4: Suspicious Activity Detection
  console.log('\n4. Testing Suspicious Activity Detection...')
  try {
    const response = await makeRequest(`${BASE_URL}/dashboard/products?search=<script>alert("xss")</script>`, 'GET')
    console.log('✅ Suspicious activity detection test completed')
  } catch (error) {
    console.log('❌ Failed to test suspicious activity detection:', error.message)
  }

  console.log('\n🎉 Security testing completed!')
}

function makeRequest(url, method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Security-Test-Script/1.0'
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

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Run the tests
testSecurityFeatures().catch(console.error)
