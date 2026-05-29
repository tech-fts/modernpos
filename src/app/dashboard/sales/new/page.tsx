'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { type SaleProduct, type SaleCustomerSummary, type CartItem, type PaymentStatus, type SaleChannel } from '@/types/sale'
import { createSale, listSaleCustomers, listSaleProducts } from '@/actions/sales'
import { getErrorMessage } from '@/actions/http'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'

// Client-side only currency symbol component to prevent hydration errors
function CurrencySymbol() {
  const { formatCurrency } = useCurrency()
  const [currencySymbol, setCurrencySymbol] = useState('')

  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    const symbol = formatCurrency(0).replace(/[\d.,]/g, '')
    setCurrencySymbol(symbol)
  }, [formatCurrency])

  // Return empty on server side to prevent hydration mismatch
  if (typeof window === 'undefined') {
    return <span>...</span>
  }

  return (
    <span>
      {currencySymbol}
    </span>
  )
}

export default function NewSalePage() {
  const router = useRouter()
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const csrfToken = useCsrfToken()
  const [products, setProducts] = useState<SaleProduct[]>([])
  const [customers, setCustomers] = useState<SaleCustomerSummary[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [paymentType, setPaymentType] = useState<'CASH' | 'CARD' | 'MOBILE_PAY'>('CASH')
  const [saleChannel, setSaleChannel] = useState<SaleChannel>('IN_STORE')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID')
  const [discount, setDiscount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMMK, setIsMMK] = useState(false)
  const inputClasses = 'block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm sm:text-base px-3 xs:px-3.5 sm:px-4 py-2 xs:py-2.5 sm:py-3'
  const actionButtonBase = 'inline-flex items-center justify-center rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-xs xs:text-sm sm:text-base'

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
    
    // Check if MMK currency is selected (client-side only)
    const checkMMK = () => {
      const symbol = formatCurrency(0).replace(/[\d.,]/g, '')
      setIsMMK(symbol.includes('MMK'))
    }
    
    // Small delay to ensure currency context is loaded
    const timer = setTimeout(checkMMK, 100)
    return () => clearTimeout(timer)
  }, [formatCurrency])

  const fetchProducts = async () => {
    try {
      const data = await listSaleProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const data = await listSaleCustomers()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const addToCart = (product: SaleProduct) => {
    const existingItem = cart.find(item => item.productId === product.id)
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
        addNotification({
          type: 'success',
          title: 'Quantity Updated',
          message: `${product.name} quantity increased to ${existingItem.quantity + 1}`,
          duration: 3000
        })
      } else {
        addNotification({
          type: 'warning',
          title: 'Stock Limit Reached',
          message: `Cannot add more ${product.name} - stock limit reached`,
          duration: 4000
        })
      }
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.price), // Convert Decimal to number
        quantity: 1,
        stock: product.stock
      }])
      addNotification({
        type: 'success',
        title: 'Product Added',
        message: `${product.name} added to cart (${formatCurrency(Number(product.price))})`,
        duration: 3000
      })
    }
  }

  const removeFromCart = (productId: string) => {
    const item = cart.find(item => item.productId === productId)
    if (item) {
      setCart(cart.filter(item => item.productId !== productId))
      addNotification({
        type: 'info',
        title: 'Product Removed',
        message: `${item.name} removed from cart (${formatCurrency(item.price)})`,
        duration: 3000
      })
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find(item => item.productId === productId)
    if (item && quantity > 0 && quantity <= item.stock) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal - discount

  const getDefaultPaymentStatus = (
    channel: SaleChannel,
    type: 'CASH' | 'CARD' | 'MOBILE_PAY'
  ): PaymentStatus => {
    if (channel === 'IN_STORE') {
      return 'PAID'
    }
    return type === 'CASH' ? 'CASH_ON_DELIVERY' : 'NOT_PAID'
  }

  const resolvePaymentStatus = (
    channel: SaleChannel,
    type: 'CASH' | 'CARD' | 'MOBILE_PAY',
    status?: PaymentStatus
  ): PaymentStatus => {
    if (channel === 'IN_STORE') {
      return 'PAID'
    }
    return status ?? getDefaultPaymentStatus(channel, type)
  }

  const handleSaleChannelChange = (value: SaleChannel) => {
    setSaleChannel(value)
    setPaymentStatus(getDefaultPaymentStatus(value, paymentType))
  }

  const handlePaymentTypeChange = (value: 'CASH' | 'CARD' | 'MOBILE_PAY') => {
    setPaymentType(value)
    if (saleChannel === 'ONLINE') {
      setPaymentStatus(getDefaultPaymentStatus(saleChannel, value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      setError('Please add items to cart')
      return
    }

    setLoading(true)
    setError('')

    try {
      const saleData = {
        customer_id: selectedCustomer || undefined,
        items: cart.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        payment_type: paymentType,
        payment_status: resolvePaymentStatus(saleChannel, paymentType, paymentStatus),
        sale_channel: saleChannel,
        discount,
        csrfToken
      }

      await createSale(saleData)
      addNotification({
        type: 'success',
        title: 'Sale Completed',
        message: `Sale has been completed successfully. Total: ${formatCurrency(total)}`,
        duration: 5000
      })
      router.push('/dashboard/sales?refresh=1')
    } catch (error) {
      console.error('Failed to create sale:', error)
      const message = getErrorMessage(error, 'Failed to create sale. Please try again.')
      setError(message)
      addNotification({
        type: 'error',
        title: 'Sale Failed',
        message,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.categories.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard/sales')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create a new sale transaction.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="submit"
            form="new-sale-form"
            disabled={loading || cart.length === 0}
            className={`${actionButtonBase} px-3 xs:px-4 sm:px-5 py-2 xs:py-2.5 sm:py-3 text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 disabled:opacity-50`}
          >
            <ShoppingCartIcon className="h-4 w-4 mr-2" />
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="bg-white shadow rounded-lg p-4">
            <input
              type="text"
              placeholder="Search products by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputClasses}
            />
          </div>

          {/* Products Grid */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Products</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <span className="text-sm text-gray-500">{product.sku}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.categories.name}</p>
                                         <div className="flex justify-between items-center">
                       <span className="text-lg font-bold text-green-600">{formatCurrency(Number(product.price))}</span>
                       <div className="flex items-center space-x-2">
                         <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                         <button
                           onClick={() => addToCart(product)}
                           disabled={product.stock === 0}
                           className={`${actionButtonBase} px-3 xs:px-3.5 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 border border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50`}
                         >
                           <PlusIcon className="h-4 w-4" />
                         </button>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          {/* Sale Details */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sale Details</h3>
            
            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className={inputClasses}
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => handlePaymentTypeChange(e.target.value as 'CASH' | 'CARD' | 'MOBILE_PAY')}
                className={inputClasses}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MOBILE_PAY">Mobile Payment</option>
              </select>
            </div>

            {/* Order Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
              <select
                value={saleChannel}
                onChange={(e) => handleSaleChannelChange(e.target.value as SaleChannel)}
                className={inputClasses}
              >
                <option value="IN_STORE">In-store</option>
                <option value="ONLINE">Online</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Payment status is only configurable for online orders.
              </p>
            </div>

            {saleChannel === 'ONLINE' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className={inputClasses}
                >
                  <option value="NOT_PAID">Not Paid</option>
                  <option value="PAID">Paid</option>
                  <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Use &quot;Cash on Delivery&quot; for online customers to collect payment later.
                </p>
              </div>
            )}

            {/* Discount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount (<CurrencySymbol />)
              </label>
              <input
                type="number"
                min="0"
                step={isMMK ? "1" : "0.01"}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className={inputClasses}
                placeholder={isMMK ? "0" : "0.00"}
              />
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Cart ({cart.length})
            </h3>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items in cart</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.sku}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                                             <span className="font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Subtotal:</span>
                 <span className="text-gray-900">{formatCurrency(subtotal)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Discount:</span>
                 <span className="text-red-600">-{formatCurrency(discount)}</span>
               </div>
               <div className="border-t border-gray-200 pt-2">
                 <div className="flex justify-between text-lg font-bold">
                   <span>Total:</span>
                   <span className="text-green-600">{formatCurrency(total)}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden form for submission */}
      <form id="new-sale-form" onSubmit={handleSubmit} className="hidden" />
    </div>
  )
}
