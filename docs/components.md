# 🧩 Component Library

**Complete UI component documentation for the Modern POS System**

## 📋 **Overview**

The Modern POS System uses a custom component library built with React, TypeScript, and Tailwind CSS. All components are designed with mobile-first principles and include responsive breakpoints for optimal display across all devices.

## 🎨 **Design System**

### **Color Palette**
```css
/* Primary Colors */
--blue-50: #eff6ff
--blue-500: #3b82f6
--blue-600: #2563eb
--blue-700: #1d4ed8

/* Success Colors */
--green-50: #f0fdf4
--green-500: #22c55e
--green-600: #16a34a

/* Warning Colors */
--yellow-50: #fffbeb
--yellow-500: #eab308
--yellow-600: #ca8a04

/* Error Colors */
--red-50: #fef2f2
--red-500: #ef4444
--red-600: #dc2626

/* Neutral Colors */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-500: #6b7280
--gray-900: #111827
```

### **Typography Scale**
```css
/* Mobile S (320px) */
--text-xs: 0.75rem    /* 12px */
--text-sm: 0.875rem   /* 14px */
--text-base: 1rem     /* 16px */

/* Tablet (768px) */
--text-lg: 1.125rem   /* 18px */
--text-xl: 1.25rem    /* 20px */

/* Desktop (1024px+) */
--text-2xl: 1.5rem    /* 24px */
--text-3xl: 1.875rem  /* 30px */
```

### **Spacing Scale**
```css
/* Responsive Spacing */
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
```

### **Breakpoints**
```css
/* Mobile First Approach */
xs: 320px    /* Mobile S */
sm: 480px    /* Mobile M */
md: 768px    /* Tablet */
lg: 1024px   /* Desktop */
xl: 1280px   /* Large Desktop */
```

## 🔌 **Core Components**

### **ProductImport Component**
**Purpose**: Bulk product import interface for CSV file uploads

**Features**:
- 📥 CSV template download
- 📤 File upload with drag & drop
- ✅ Data validation and error reporting
- 📱 Mobile-optimized interface
- 📊 Import results with success/failure counts

**Props**:
```typescript
interface ProductImportProps {
  // No props required - self-contained component
}
```

**Usage**:
```tsx
import ProductImport from '@/components/ProductImport'

function ProductsPage() {
  return (
    <div>
      <ProductImport />
    </div>
  )
}
```

**States**:
- **No File**: Upload prompt with template download
- **File Selected**: File info with import button
- **Importing**: Loading state with progress
- **Results**: Success/failure counts with error details

**Mobile Optimization**:
- Touch-friendly file upload
- Responsive button sizes
- Compact error display
- Long-press tooltips for icons

### **CurrencySelector Component**
**Purpose**: Dynamic currency switching with responsive display

**Features**:
- 💱 Multi-currency support (MMK, USD, EUR)
- 📱 Responsive text visibility
- 🔄 Real-time currency updates
- 🎨 Clean dropdown interface

**Props**:
```typescript
interface CurrencySelectorProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}
```

**Usage**:
```tsx
import CurrencySelector from '@/components/CurrencySelector'

function Dashboard() {
  return (
    <div>
      <CurrencySelector size="md" />
    </div>
  )
}
```

**Responsive Behavior**:
- **Mobile S (320px)**: Currency symbol only
- **Tablet (768px)**: Symbol + code (e.g., "MMK")
- **Desktop (1024px+)**: Full currency name

**Currency Options**:
```typescript
const currencies = [
  { code: 'MMK', symbol: 'MMK', name: 'Myanmar Kyat', position: 'after' },
  { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before' },
  { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' }
]
```

### **QuickSearch Component**
**Purpose**: Global search functionality across products, customers, and sales

**Features**:
- 🔍 Real-time search results
- 📱 Mobile-optimized interface
- 🎯 Category-based filtering
- ⚡ Instant search suggestions

**Props**:
```typescript
interface QuickSearchProps {
  placeholder?: string
  onResultSelect?: (result: SearchResult) => void
  className?: string
}
```

**Search Types**:
```typescript
interface SearchResult {
  type: 'product' | 'customer' | 'sale'
  id: string
  title: string
  subtitle: string
  metadata: Record<string, any>
}
```

**Usage**:
```tsx
import QuickSearch from '@/components/QuickSearch'

function Dashboard() {
  const handleResultSelect = (result: SearchResult) => {
    // Navigate to result
    router.push(`/dashboard/${result.type}s/${result.id}`)
  }

  return (
    <QuickSearch 
      placeholder="Search products, customers, sales..."
      onResultSelect={handleResultSelect}
    />
  )
}
```

### **LowStockAlert Component**
**Purpose**: Display low stock warnings and alerts

**Features**:
- ⚠️ Configurable stock thresholds
- 📱 Responsive alert display
- 🔄 Real-time stock updates
- 🎨 Visual warning indicators

**Props**:
```typescript
interface LowStockAlertProps {
  threshold?: number
  showCount?: boolean
  className?: string
}
```

**Usage**:
```tsx
import LowStockAlert from '@/components/LowStockAlert'

function Dashboard() {
  return (
    <div>
      <LowStockAlert threshold={10} showCount={true} />
    </div>
  )
}
```

**Alert States**:
- **Normal**: No alert displayed
- **Warning**: Stock below threshold
- **Critical**: Very low stock
- **Out of Stock**: Zero stock

### **CurrencyDisplay Component**
**Purpose**: Format and display currency values consistently

**Features**:
- 💱 Dynamic currency formatting
- 📱 Responsive text sizes
- 🎯 Context-aware display
- 🔄 Real-time currency updates

**Props**:
```typescript
interface CurrencyDisplayProps {
  amount: number
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  showSymbol?: boolean
  className?: string
}
```

**Usage**:
```tsx
import CurrencyDisplay from '@/components/CurrencyDisplay'

function ProductCard({ product }) {
  return (
    <div>
      <CurrencyDisplay 
        amount={product.price} 
        size="lg" 
        showSymbol={true}
      />
    </div>
  )
}
```

**Formatting Examples**:
```typescript
// MMK: 25000 → "25000 MMK"
// USD: 25.50 → "$25.50"
// EUR: 25.50 → "€25.50"
```

## 📱 **Mobile-First Components**

### **MobileNavigation Component**
**Purpose**: Bottom navigation for mobile devices

**Features**:
- 📱 Thumb-friendly positioning
- 🎯 Active state indicators
- 🔄 Smooth transitions
- 📱 Responsive icon sizing

**Navigation Items**:
```typescript
const navItems = [
  { path: '/dashboard', icon: HomeIcon, label: 'Home' },
  { path: '/dashboard/products', icon: CubeIcon, label: 'Products' },
  { path: '/dashboard/sales', icon: ShoppingCartIcon, label: 'Sales' },
  { path: '/dashboard/reports', icon: ChartBarIcon, label: 'Reports' },
  { path: '/dashboard/settings', icon: Cog6ToothIcon, label: 'Settings' }
]
```

**Responsive Behavior**:
- **Mobile S (320px)**: Icons only, compact spacing
- **Mobile M (480px)**: Icons + small labels
- **Tablet (768px)**: Hidden (uses sidebar navigation)

### **ResponsiveButton Component**
**Purpose**: Touch-optimized buttons with responsive sizing

**Features**:
- 👆 Large touch targets (min 44px)
- 📱 Responsive text and icon sizes
- 🎨 Multiple variants and states
- 💡 Long-press tooltips

**Variants**:
```typescript
type ButtonVariant = 
  | 'primary'    // Blue background
  | 'secondary'  // Gray border
  | 'danger'     // Red background
  | 'success'    // Green background
  | 'ghost'      // Transparent
```

**Sizes**:
```typescript
type ButtonSize = 
  | 'xs'   // 32px height, small text
  | 'sm'   // 36px height, small text
  | 'md'   // 40px height, base text
  | 'lg'   // 44px height, large text
  | 'xl'   // 48px height, xl text
```

**Usage**:
```tsx
import ResponsiveButton from '@/components/ResponsiveButton'

function ActionBar() {
  return (
    <div className="flex space-x-2">
      <ResponsiveButton 
        variant="primary" 
        size="lg"
        onClick={handleSave}
      >
        Save Changes
      </ResponsiveButton>
      
      <ResponsiveButton 
        variant="secondary" 
        size="md"
        onClick={handleCancel}
      >
        Cancel
      </ResponsiveButton>
    </div>
  )
}
```

### **MobileCard Component**
**Purpose**: Responsive card layouts for mobile devices

**Features**:
- 📱 Mobile-optimized spacing
- 🎨 Consistent visual hierarchy
- 🔄 Responsive content layout
- 💫 Smooth hover animations

**Variants**:
```typescript
type CardVariant = 
  | 'default'    // White background, gray border
  | 'elevated'   // White background, shadow
  | 'outlined'   // Transparent, colored border
  | 'filled'     // Colored background
```

**Usage**:
```tsx
import MobileCard from '@/components/MobileCard'

function ProductGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(product => (
        <MobileCard 
          key={product.id}
          variant="elevated"
          className="hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-medium">{product.name}</h3>
          <p className="text-gray-600">{product.description}</p>
          <CurrencyDisplay amount={product.price} />
        </MobileCard>
      ))}
    </div>
  )
}
```

## 🎨 **Form Components**

### **ResponsiveInput Component**
**Purpose**: Touch-friendly input fields with responsive sizing

**Features**:
- 👆 Large touch targets
- 📱 Responsive text sizes
- 🎯 Focus and error states
- 💡 Helpful placeholder text

**Types**:
```typescript
type InputType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
```

**States**:
- **Default**: Gray border, black text
- **Focus**: Blue border, blue ring
- **Error**: Red border, red text
- **Success**: Green border, green text
- **Disabled**: Gray background, muted text

**Usage**:
```tsx
import ResponsiveInput from '@/components/ResponsiveInput'

function ProductForm() {
  return (
    <form className="space-y-4">
      <ResponsiveInput
        label="Product Name"
        type="text"
        placeholder="Enter product name"
        required
        error={errors.name}
      />
      
      <ResponsiveInput
        label="Price"
        type="number"
        placeholder="0"
        min="0"
        step="0.01"
        required
        error={errors.price}
      />
    </form>
  )
}
```

### **ResponsiveSelect Component**
**Purpose**: Mobile-optimized dropdown selectors

**Features**:
- 📱 Large touch targets
- 🎯 Clear visual feedback
- 🔍 Search functionality (optional)
- 💡 Helpful option descriptions

**Usage**:
```tsx
import ResponsiveSelect from '@/components/ResponsiveSelect'

function CategorySelect() {
  const options = [
    { value: 'electronics', label: 'Electronics', description: 'Electronic devices and accessories' },
    { value: 'clothing', label: 'Clothing', description: 'Apparel and fashion items' },
    { value: 'home', label: 'Home & Garden', description: 'Home improvement and garden supplies' }
  ]

  return (
    <ResponsiveSelect
      label="Category"
      options={options}
      value={selectedCategory}
      onChange={setSelectedCategory}
      placeholder="Select a category"
      required
    />
  )
}
```

## 📊 **Data Display Components**

### **ResponsiveTable Component**
**Purpose**: Mobile-friendly data tables

**Features**:
- 📱 Horizontal scrolling on mobile
- 🎯 Responsive column hiding
- 🔍 Sortable columns
- 📄 Pagination support

**Usage**:
```tsx
import ResponsiveTable from '@/components/ResponsiveTable'

function ProductsTable() {
  const columns = [
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'price', label: 'Price', sortable: true, render: (value) => <CurrencyDisplay amount={value} /> },
    { key: 'stock', label: 'Stock', sortable: true },
    { key: 'actions', label: 'Actions', render: (_, row) => <ActionButtons product={row} /> }
  ]

  return (
    <ResponsiveTable
      columns={columns}
      data={products}
      sortable={true}
      pagination={true}
      pageSize={20}
    />
  )
}
```

### **ResponsiveChart Component**
**Purpose**: Mobile-optimized data visualization

**Features**:
- 📱 Touch-friendly interactions
- 🎨 Responsive chart sizing
- 🔍 Interactive tooltips
- 📊 Multiple chart types

**Chart Types**:
```typescript
type ChartType = 
  | 'bar'      // Bar chart
  | 'line'     // Line chart
  | 'pie'      // Pie chart
  | 'doughnut' // Doughnut chart
  | 'area'     // Area chart
```

**Usage**:
```tsx
import ResponsiveChart from '@/components/ResponsiveChart'

function SalesChart() {
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Sales',
      data: [12000, 19000, 15000, 25000, 22000],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2
    }]
  }

  return (
    <ResponsiveChart
      type="bar"
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }}
      height={300}
    />
  )
}
```

## 🔔 **Feedback Components**

### **Notification Component**
**Purpose**: User feedback and system notifications

**Types**:
```typescript
type NotificationType = 
  | 'success'   // Green, checkmark icon
  | 'error'     // Red, X icon
  | 'warning'   // Yellow, exclamation icon
  | 'info'      // Blue, information icon
```

**Features**:
- 🎨 Type-based styling
- ⏰ Auto-dismiss timers
- 🔄 Action buttons
- 📱 Mobile-optimized positioning

**Usage**:
```tsx
import { useNotifications } from '@/contexts/NotificationContext'

function ProductActions() {
  const { addNotification } = useNotifications()

  const handleDelete = () => {
    addNotification({
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this product?',
      duration: 0,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {},
          variant: 'secondary'
        },
        {
          label: 'Delete',
          onClick: () => deleteProduct(),
          variant: 'danger'
        }
      ]
    })
  }

  return (
    <button onClick={handleDelete}>
      Delete Product
    </button>
  )
}
```

### **LoadingSpinner Component**
**Purpose**: Visual feedback during async operations

**Features**:
- 🌀 Smooth animation
- 📱 Responsive sizing
- 🎨 Customizable colors
- 💡 Loading text support

**Sizes**:
```typescript
type SpinnerSize = 
  | 'xs'   // 16px
  | 'sm'   // 24px
  | 'md'   // 32px
  | 'lg'   | 48px
  | 'xl'   // 64px
```

**Usage**:
```tsx
import LoadingSpinner from '@/components/LoadingSpinner'

function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
      <span className="ml-3 text-gray-600">Loading products...</span>
    </div>
  )
}
```

## 🎯 **Layout Components**

### **ResponsiveContainer Component**
**Purpose**: Consistent responsive layout wrapper

**Features**:
- 📱 Mobile-first responsive design
- 🎯 Consistent padding and margins
- 🔄 Breakpoint-based adjustments
- 💫 Smooth responsive transitions

**Usage**:
```tsx
import ResponsiveContainer from '@/components/ResponsiveContainer'

function Dashboard() {
  return (
    <ResponsiveContainer>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard content */}
      </div>
    </ResponsiveContainer>
  )
}
```

### **ResponsiveGrid Component**
**Purpose**: Flexible grid layouts for different screen sizes

**Features**:
- 📱 Mobile-first grid system
- 🎯 Automatic responsive breakpoints
- 🔄 Dynamic column adjustment
- 💫 Smooth layout transitions

**Usage**:
```tsx
import ResponsiveGrid from '@/components/ResponsiveGrid'

function ProductGrid() {
  return (
    <ResponsiveGrid
      cols={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
      gap={{ xs: 2, sm: 3, md: 4, lg: 6 }}
    >
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ResponsiveGrid>
  )
}
```

## 🧪 **Testing Components**

### **Component Testing Guidelines**

**Unit Tests**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import ProductImport from '@/components/ProductImport'

describe('ProductImport', () => {
  it('renders upload interface', () => {
    render(<ProductImport />)
    expect(screen.getByText('Bulk Product Import')).toBeInTheDocument()
    expect(screen.getByText('Download Template')).toBeInTheDocument()
  })

  it('handles file upload', () => {
    render(<ProductImport />)
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const input = screen.getByLabelText(/upload a csv file/i)
    
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText('test.csv')).toBeInTheDocument()
  })
})
```

**Integration Tests**:
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import ProductImport from '@/components/ProductImport'

const server = setupServer(
  rest.post('/api/products/import', (req, res, ctx) => {
    return res(ctx.json({
      message: 'Import completed',
      results: { total: 10, success: 10, failed: 0, errors: [] }
    }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('ProductImport Integration', () => {
  it('successfully imports products', async () => {
    render(<ProductImport />)
    
    // Upload file and click import
    // ... test implementation
    
    await waitFor(() => {
      expect(screen.getByText('Import completed')).toBeInTheDocument()
    })
  })
})
```

## 📱 **Mobile Optimization Tips**

### **Touch Targets**
- **Minimum Size**: 44px × 44px for all interactive elements
- **Spacing**: 8px minimum between touch targets
- **Padding**: Generous padding for better touch accuracy

### **Responsive Text**
- **Mobile S**: 12px-14px for body text
- **Tablet**: 14px-16px for body text
- **Desktop**: 16px-18px for body text

### **Layout Considerations**
- **Single Column**: Mobile-first single column layouts
- **Progressive Enhancement**: Add columns as screen size increases
- **Touch Scrolling**: Enable smooth scrolling for long content

### **Performance**
- **Lazy Loading**: Load components and data on demand
- **Image Optimization**: Use appropriate image sizes for each breakpoint
- **Animation**: Keep animations under 300ms for smooth feel

---

**📖 For more details, see the [Project Details](projectdetail.md) and [API Reference](api.md) documentation.**
