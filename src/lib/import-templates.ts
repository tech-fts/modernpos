export const productImportTemplateCsv = `name,description,price,cost,stock,category_name
"Premium T-Shirt","High-quality cotton t-shirt",25000,15000,50,"Apparel"
"Classic Jeans","Comfortable denim jeans",45000,28000,30,"Apparel"`

export const categoryImportTemplateCsv = `name,description
"Electronics","Electronic devices and accessories"
"Smartphones","Mobile phones and related accessories"
"Laptops","Portable computers and accessories"
"Tablets","Tablet devices and accessories"
"Audio","Audio equipment and accessories"`

export const downloadCsvTemplate = (filename: string, csvContent: string) => {
  if (typeof window === 'undefined') return

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}
