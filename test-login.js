/**
 * Test Login Script
 * Tests the login API with email and password
 * 
 * Run: node test-login.js
 */
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
  console.log('='.repeat(60));
  console.log('🔐 School Management System - Login Test');
  console.log('='.repeat(60));

  // Test 1: Login with admin credentials
  console.log('\n📋 Test 1: Login with Admin account');
  console.log('   Email: admin@school.com');
  console.log('   Password: admin123');
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@school.com',
      password: 'admin123'
    });
    console.log('   ✅ LOGIN SUCCESS!');
    console.log(`   User: ${res.data.user.full_name}`);
    console.log(`   Role: ${res.data.user.role}`);
    console.log(`   Email: ${res.data.user.email}`);
    console.log(`   Token: ${res.data.token.substring(0, 30)}...`);
    
    // Test 2: Test user login
    console.log('\n📋 Test 2: Login with Test User account');
    console.log('   Email: test@school.com');
    console.log('   Password: test123');
    try {
      const res2 = await axios.post(`${API_URL}/auth/login`, {
        email: 'test@school.com',
        password: 'test123'
      });
      console.log('   ✅ LOGIN SUCCESS!');
      console.log(`   User: ${res2.data.user.full_name}`);
      console.log(`   Role: ${res2.data.user.role}`);
      console.log(`   Email: ${res2.data.user.email}`);
    } catch (err) {
      console.log(`   ❌ Test user login failed: ${err.response?.data?.message || err.message}`);
    }

    // Test 3: Test wrong password
    console.log('\n📋 Test 3: Login with wrong password');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@school.com',
        password: 'wrongpassword'
      });
      console.log('   ❌ Should have failed!');
    } catch (err) {
      console.log(`   ✅ Correctly rejected: ${err.response?.data?.message || err.message}`);
    }

    // Test 4: Test non-existent email
    console.log('\n📋 Test 4: Login with non-existent email');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'nobody@school.com',
        password: 'password123'
      });
      console.log('   ❌ Should have failed!');
    } catch (err) {
      console.log(`   ✅ Correctly rejected: ${err.response?.data?.message || err.message}`);
    }

    // Test 5: Test missing fields
    console.log('\n📋 Test 5: Login with missing fields');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: ''
      });
      console.log('   ❌ Should have failed!');
    } catch (err) {
      console.log(`   ✅ Correctly rejected: ${err.response?.data?.message || err.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All login tests completed!');
    console.log('='.repeat(60));
    console.log('\n📝 Test Credentials Summary:');
    console.log('   Admin:  admin@school.com / admin123');
    console.log('   Test:   test@school.com / test123');
    console.log('\n🌐 Open the app at: http://localhost:3000/login');
  } catch (err) {
    console.log(`   ❌ Admin login failed: ${err.response?.data?.message || err.message}`);
    console.log('\n   Make sure the server is running:');
    console.log('   cd school_api && npm run dev');
  }
}

testLogin();