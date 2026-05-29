// Clear any conflicting currency localStorage data
// Run this in the browser console to reset currency settings

console.log('🧹 Clearing currency localStorage data...')

// Remove old settings currency
localStorage.removeItem('pos-settings')

// Remove any conflicting currency keys
localStorage.removeItem('currency')
localStorage.removeItem('preferred-currency')

console.log('✅ Currency localStorage cleared!')

// Set MMK as default
localStorage.setItem('preferred-currency', 'MMK')
console.log('💱 Set MMK as default currency')

// Reload the page to apply changes
console.log('🔄 Reload the page to see changes')
