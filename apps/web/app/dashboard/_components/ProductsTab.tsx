'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Lock, Sparkles, Plus, FileDown, Eye, CopyPlus, Package, Loader2,
  Trash2, Edit, Save, Check, ChevronDown, ChevronLeft, ChevronRight,
  Upload, Star, X, AlertCircle, Layers, FileText
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Star rendering helper
const renderStars = (rating: number | string | null | undefined) => {
  const ratingVal = rating ? Math.round(parseFloat(rating.toString())) : 0
  return (
    <div className="flex items-center gap-0.5 animate-fadeIn">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= ratingVal
        return (
          <Star
            key={starIndex}
            size={11}
            className={isFilled ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}
          />
        )
      })}
    </div>
  )
}

// Subcomponent to render product card images with carousel (auto slide & manual controls)
const ProductCardCarousel = ({ imageUrls, alt, objectFit = 'cover' }: { imageUrls: string[]; alt: string; objectFit?: 'cover' | 'contain' }) => {
  const length = imageUrls.length
  const [currentIndex, setCurrentIndex] = useState(1) // Start at index 1 (the first real slide)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [sliding, setSliding] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Double clones at start and end for infinite looping scroll
  const slides = [imageUrls[length - 1], ...imageUrls, imageUrls[0]]

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (sliding) return
    setSliding(true)
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
  }

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (sliding) return
    setSliding(true)
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev - 1)
  }

  const selectSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (sliding) return
    setSliding(true)
    setIsTransitioning(true)
    setCurrentIndex(index + 1)
  }

  const handleTransitionEnd = () => {
    setSliding(false)
    if (currentIndex === 0) {
      setIsTransitioning(false)
      setCurrentIndex(length)
    } else if (currentIndex === length + 1) {
      setIsTransitioning(false)
      setCurrentIndex(1)
    }
  }

  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true)
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [isTransitioning])

  const startAutoSlide = () => {
    stopAutoSlide()
    timerRef.current = setInterval(() => {
      if (!sliding) {
        setSliding(true)
        setIsTransitioning(true)
        setCurrentIndex((prev) => prev + 1)
      }
    }, 3000)
  }

  const stopAutoSlide = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (length > 1) {
      startAutoSlide()
    }
    return () => stopAutoSlide()
  }, [length])

  if (!imageUrls || length === 0) return null

  if (length === 1) {
    return (
      <img
        src={imageUrls[0]}
        alt={alt}
        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
      />
    )
  }

  return (
    <div
      className="relative w-full h-full group/carousel overflow-hidden"
      onMouseEnter={stopAutoSlide}
      onMouseLeave={startAutoSlide}
    >
      {/* Slides Container */}
      <div
        className="absolute inset-0 flex"
        onTransitionEnd={handleTransitionEnd}
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning ? 'transform 500ms ease-out' : 'none'
        }}
      >
        {slides.map((url, idx) => (
          <div key={idx} className="w-full h-full shrink-0">
            <img src={url} alt={`${alt} - slide`} className={`w-full h-full object-${objectFit}`} />
          </div>
        ))}
      </div>

      {/* Manual controls: Left Arrow */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer z-10"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Manual controls: Right Arrow */}
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer z-10"
      >
        <ChevronRight size={14} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {imageUrls.map((_, idx) => {
          let displayActive = false
          if (currentIndex === 0) {
            displayActive = idx === length - 1
          } else if (currentIndex === length + 1) {
            displayActive = idx === 0
          } else {
            displayActive = idx === currentIndex - 1
          }

          return (
            <button
              key={idx}
              onClick={(e) => selectSlide(idx, e)}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${displayActive ? 'bg-white scale-110 shadow-xs' : 'bg-white/40 hover:bg-white/60'}`}
            />
          )
        })}
      </div>
    </div>
  )
}

export function ProductsTab() {
  const {
    user,
    profile,
    activeCard,
    activeProfile,
    cardProfiles,
    profileProducts,
    setProfileProducts,
    profileProductsLoading,
    allAccountProducts,
    setAllAccountProducts,
    leadForms,
    setUpgradeModalOpen,
    setUpgradeModalFeature,
    setMessage,
    fetchProfileProducts
  } = useDashboard()

  const supabase = createClient()
  const router = useRouter()
  const isAllCards = activeCard?.id === 'all'

  // Local States
  const [productReviews, setProductReviews] = useState<any[]>([])
  const [productSheetOpen, setProductSheetOpen] = useState(false)
  const [productFormMode, setProductFormMode] = useState<'add' | 'edit' | 'view'>('add')
  const [isConfirmingProductDelete, setIsConfirmingProductDelete] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [productSaving, setProductSaving] = useState(false)
  const [productDeleting, setProductDeleting] = useState<string | null>(null)

  // Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price_inr: '', // rupees display, paise backend
    net_quantity: '0',
    link_url: '',
    enquiry_form_id: '',
    is_active: true
  })
  const [productImages, setProductImages] = useState<any[]>([])
  const [uploadingProductImages, setUploadingProductImages] = useState(false)
  const [deletedExistingImageUrls, setDeletedExistingImageUrls] = useState<string[]>([])

  // Review states
  const [newReviewRating, setNewReviewRating] = useState('5')
  const [newReviewText, setNewReviewText] = useState('')
  const [newReviewName, setNewReviewName] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)

  // Duplication States
  const [duplicateProductDialogOpen, setDuplicateProductDialogOpen] = useState(false)
  const [duplicatingProduct, setDuplicatingProduct] = useState<any | null>(null)
  const [duplicateProductTargetProfileId, setDuplicateProductTargetProfileId] = useState<string>('')
  const [duplicateProductName, setDuplicateProductName] = useState('')
  const [duplicateProductConflict, setDuplicateProductConflict] = useState(false)
  const [duplicateProductCheckingConflict, setDuplicateProductCheckingConflict] = useState(false)
  const [duplicatingProductProgress, setDuplicatingProductProgress] = useState(false)

  // Duplicate from others
  const [duplicateFromOthersDialogOpen, setDuplicateFromOthersDialogOpen] = useState(false)
  const [selectedSourceProfileId, setSelectedSourceProfileId] = useState('')
  const [selectedSourceProductId, setSelectedSourceProductId] = useState('')
  const [duplicateFromOthersProductName, setDuplicateFromOthersProductName] = useState('')
  const [duplicateFromOthersConflict, setDuplicateFromOthersConflict] = useState(false)
  const [duplicateFromOthersCheckingConflict, setDuplicateFromOthersCheckingConflict] = useState(false)
  const [duplicatingFromOthersProgress, setDuplicatingFromOthersProgress] = useState(false)

  // Load reviews for the current active profile products
  useEffect(() => {
    const fetchReviews = async () => {
      const productIds = profileProducts.map(p => p.id)
      if (productIds.length > 0) {
        const { data, error } = await supabase
          .from('profile_product_reviews')
          .select('*')
          .in('product_id', productIds)
          .order('created_at', { ascending: false })
        if (!error && data) {
          setProductReviews(data)
        } else {
          setProductReviews([])
        }
      } else {
        setProductReviews([])
      }
    }
    fetchReviews()
  }, [profileProducts])

  // Products CSV Export
  const handleExportProductsCSV = () => {
    const headers = ['Name', 'Description', 'Price (INR)', 'Net Quantity', 'View Count', 'Rating', 'Review', 'External Link', 'Status']
    const rows = profileProducts.map(p => [
      p.name || '',
      p.description || '',
      p.price_inr ? (p.price_inr / 100).toFixed(2) : 'Price on Request',
      (p.net_quantity ?? 0).toString(),
      (p.view_count ?? 0).toString(),
      p.rating ? parseFloat(p.rating).toFixed(1) : 'No Rating',
      p.review || '',
      p.link_url || '',
      p.is_active ? 'Active' : 'Inactive'
    ])
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `envitra_products_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Database actions: Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.name || !activeProfile?.id || !user?.id) return
    setProductSaving(true)
    try {
      const parsedPrice = productForm.price_inr ? Math.round(parseFloat(productForm.price_inr) * 100) : null
      const parsedQuantity = parseInt(productForm.net_quantity, 10) || 0
      const parsedViews = productFormMode === 'edit' ? (editingProduct?.view_count ?? 0) : 0

      const finalUrls: string[] = []
      for (const img of productImages) {
        if (img.type === 'existing') {
          finalUrls.push(img.url)
        } else if (img.type === 'new') {
          const fileExt = img.file.name.split('.').pop()
          const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
          const filePath = `${fileName}`

          const { error } = await supabase.storage
            .from('product-images')
            .upload(filePath, img.file)
          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

          finalUrls.push(publicUrl)
        }
      }

      const payload: any = {
        profile_id: activeProfile.id,
        account_id: user.id,
        name: productForm.name,
        description: productForm.description || null,
        price_inr: parsedPrice,
        net_quantity: parsedQuantity,
        view_count: parsedViews,
        link_url: productForm.link_url || null,
        enquiry_form_id: productForm.enquiry_form_id || null,
        is_active: productForm.is_active,
        image_urls: finalUrls,
        image_url: finalUrls[0] || null
      }

      if (productFormMode === 'add') {
        const { data, error } = await supabase
          .from('profile_products')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setProfileProducts(prev => [...prev, data])
        setMessage({ type: 'success', text: 'Product added successfully!' })
      } else {
        const { data, error } = await supabase
          .from('profile_products')
          .update(payload)
          .eq('id', editingProduct.id)
          .select()
          .single()
        if (error) throw error
        setProfileProducts(prev => prev.map(p => p.id === editingProduct.id ? data : p))
        setMessage({ type: 'success', text: 'Product updated successfully!' })
      }

      // Cleanup deleted bucket images
      for (const url of deletedExistingImageUrls) {
        try {
          const isReferenced = allAccountProducts.some(
            p => p.id !== editingProduct?.id && p.image_urls && Array.isArray(p.image_urls) && p.image_urls.includes(url)
          )
          if (!isReferenced && url.includes('/public/product-images/')) {
            const parts = url.split('/public/product-images/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('product-images').remove([path])
            }
          }
        } catch (delErr) {
          console.error('Failed to delete removed image from bucket:', url, delErr)
        }
      }

      fetchAllAccountProducts()

      productImages.forEach(img => {
        if (img.type === 'new') {
          URL.revokeObjectURL(img.previewUrl)
        }
      })
      setProductSheetOpen(false)
    } catch (err: any) {
      console.error('Failed to save product:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save product.' })
    } finally {
      setProductSaving(false)
    }
  }

  // Delete Product
  const confirmDeleteProduct = async (id: string) => {
    setProductDeleting(id)
    try {
      const prod = profileProducts.find(p => p.id === id)
      const { error } = await supabase
        .from('profile_products')
        .delete()
        .eq('id', id)
      if (error) throw error

      if (prod?.image_urls && Array.isArray(prod.image_urls)) {
        for (const url of prod.image_urls) {
          const isReferenced = allAccountProducts.some(
            p => p.id !== id && p.image_urls && Array.isArray(p.image_urls) && p.image_urls.includes(url)
          )
          if (!isReferenced && typeof url === 'string' && url.includes('/public/product-images/')) {
            const parts = url.split('/public/product-images/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('product-images').remove([path])
            }
          }
        }
      }

      setProfileProducts(prev => prev.filter(p => p.id !== id))
      fetchAllAccountProducts()
      setMessage({ type: 'success', text: 'Product deleted successfully!' })
    } catch (err: any) {
      console.error('Failed to delete product:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete product.' })
    } finally {
      setProductDeleting(null)
    }
  }

  // Reviews CRUD
  const handleDeleteReview = async (reviewId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('profile_product_reviews')
        .delete()
        .eq('id', reviewId)
      if (error) throw error
      setProductReviews(prev => prev.filter(r => r.id !== reviewId))

      const { data: updatedProduct } = await supabase
        .from('profile_products')
        .select('*')
        .eq('id', productId)
        .single()
      if (updatedProduct) {
        setProfileProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p))
      }
      setMessage({ type: 'success', text: 'Review deleted.' })
    } catch (err: any) {
      console.error('Failed to delete review:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete review.' })
    }
  }

  // Image Upload and controls
  const handleUploadProductImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return
    const newItems: any[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const previewUrl = URL.createObjectURL(file)
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        type: 'new',
        file,
        previewUrl
      })
    }
    setProductImages(prev => [...prev, ...newItems])
  }

  const handleDeleteProductImage = (id: string) => {
    const target = productImages.find(img => img.id === id)
    if (!target) return

    if (target.type === 'new') {
      URL.revokeObjectURL(target.previewUrl)
    } else if (target.type === 'existing') {
      setDeletedExistingImageUrls(prev => [...prev, target.url])
    }
    setProductImages(prev => prev.filter(img => img.id !== id))
  }

  const moveProductImage = (index: number, direction: 'up' | 'down') => {
    const list = [...productImages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return
    const temp = list[index]
    list[index] = list[targetIndex]
    list[targetIndex] = temp
    setProductImages(list)
  }

  // Dialog actions: Duplicate Product
  const checkDuplicateProductConflict = async (name: string, targetProfileId: string) => {
    if (!targetProfileId) return
    setDuplicateProductCheckingConflict(true)
    try {
      const { data, error } = await supabase
        .from('profile_products')
        .select('name')
        .eq('profile_id', targetProfileId)
      if (error) throw error
      if (data) {
        const conflict = data.some((p: any) => p.name.trim().toLowerCase() === name.trim().toLowerCase())
        setDuplicateProductConflict(conflict)
      }
    } catch (err) {
      console.error('Failed to check duplication conflict:', err)
    } finally {
      setDuplicateProductCheckingConflict(false)
    }
  }

  const openDuplicateProductDialog = (product: any) => {
    setDuplicatingProduct(product)
    setDuplicateProductName(product.name || '')
    const targetId = cardProfiles.filter((p: any) => p.id !== activeProfile?.id)[0]?.id || ''
    setDuplicateProductTargetProfileId(targetId)
    setDuplicateProductConflict(false)
    setDuplicateProductDialogOpen(true)
    if (targetId) {
      checkDuplicateProductConflict(product.name, targetId)
    }
  }

  const confirmDuplicateProduct = async () => {
    if (!duplicatingProduct || !duplicateProductTargetProfileId || !user?.id) return
    setDuplicatingProductProgress(true)
    try {
      const targetProfile = cardProfiles.find((p: any) => p.id === duplicateProductTargetProfileId)
      const { error } = await supabase
        .from('profile_products')
        .insert({
          profile_id: duplicateProductTargetProfileId,
          account_id: user.id,
          name: duplicateProductName.trim(),
          description: duplicatingProduct.description,
          price_inr: duplicatingProduct.price_inr,
          currency: duplicatingProduct.currency || 'INR',
          is_active: false,
          image_urls: duplicatingProduct.image_urls || [],
          image_url: duplicatingProduct.image_url || null,
          net_quantity: duplicatingProduct.net_quantity || 0,
          rating: null,
          review: null,
          click_count: 0,
          view_count: 0,
          link_url: duplicatingProduct.link_url || null,
          enquiry_form_id: null
        })
      if (error) throw error
      setDuplicateProductDialogOpen(false)
      fetchAllAccountProducts()
      setMessage({ type: 'success', text: `Product duplicated to "${targetProfile?.profile_name || 'profile'}" successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate product.' })
    } finally {
      setDuplicatingProductProgress(false)
    }
  }

  // Duplicate from others
  const checkDuplicateFromOthersConflict = async (name: string, targetProfileId: string) => {
    if (!targetProfileId) return
    setDuplicateFromOthersCheckingConflict(true)
    try {
      const { data, error } = await supabase
        .from('profile_products')
        .select('name')
        .eq('profile_id', targetProfileId)
      if (error) throw error
      if (data) {
        const conflict = data.some((p: any) => p.name.trim().toLowerCase() === name.trim().toLowerCase())
        setDuplicateFromOthersConflict(conflict)
      }
    } catch (err) {
      console.error('Failed to check duplicate from others conflict:', err)
    } finally {
      setDuplicateFromOthersCheckingConflict(false)
    }
  }

  const confirmDuplicateFromOthers = async () => {
    if (!selectedSourceProductId || !activeProfile?.id || !user?.id) return
    setDuplicatingFromOthersProgress(true)
    try {
      const sourceProduct = allAccountProducts.find(p => p.id === selectedSourceProductId)
      if (!sourceProduct) throw new Error('Source product not found.')

      const { error } = await supabase
        .from('profile_products')
        .insert({
          profile_id: activeProfile.id,
          account_id: user.id,
          name: duplicateFromOthersProductName.trim(),
          description: sourceProduct.description,
          price_inr: sourceProduct.price_inr,
          currency: sourceProduct.currency || 'INR',
          is_active: false,
          image_urls: sourceProduct.image_urls || [],
          image_url: sourceProduct.image_url || null,
          net_quantity: sourceProduct.net_quantity || 0,
          rating: null,
          review: null,
          click_count: 0,
          view_count: 0,
          link_url: sourceProduct.link_url || null,
          enquiry_form_id: null
        })
      if (error) throw error
      setDuplicateFromOthersDialogOpen(false)
      fetchProfileProducts(activeProfile.id)
      fetchAllAccountProducts()
      setMessage({ type: 'success', text: `Product duplicated successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate product.' })
    } finally {
      setDuplicatingFromOthersProgress(false)
    }
  }

  const openDuplicateFromOthersDialog = () => {
    const sourceProfiles = cardProfiles.filter(profile =>
      allAccountProducts.some(p => p.profile_id === profile.id) && profile.id !== activeProfile?.id
    )
    const firstProfileId = sourceProfiles[0]?.id || ''
    setSelectedSourceProfileId(firstProfileId)

    if (firstProfileId) {
      const firstProduct = allAccountProducts.find(prod => prod.profile_id === firstProfileId)
      if (firstProduct) {
        setSelectedSourceProductId(firstProduct.id)
        setDuplicateFromOthersProductName(firstProduct.name || '')
        if (activeProfile?.id) {
          checkDuplicateFromOthersConflict(firstProduct.name, activeProfile.id)
        }
      } else {
        setSelectedSourceProductId('')
        setDuplicateFromOthersProductName('')
        setDuplicateFromOthersConflict(false)
      }
    } else {
      setSelectedSourceProductId('')
      setDuplicateFromOthersProductName('')
      setDuplicateFromOthersConflict(false)
    }
    setDuplicateFromOthersDialogOpen(true)
  }

  const fetchAllAccountProducts = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('profile_products')
        .select('*')
        .eq('account_id', user.id)
      if (!error && data) {
        setAllAccountProducts(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Opening sheets helpers
  const openAddProduct = () => {
    setProductFormMode('add')
    setEditingProduct(null)
    setIsConfirmingProductDelete(false)
    setProductForm({
      name: '',
      description: '',
      price_inr: '',
      net_quantity: '0',
      link_url: '',
      enquiry_form_id: '',
      is_active: true
    })
    setProductImages([])
    setDeletedExistingImageUrls([])
    setProductSheetOpen(true)
  }

  const openEditProduct = (product: any) => {
    setProductFormMode('edit')
    setEditingProduct(product)
    setIsConfirmingProductDelete(false)
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price_inr: product.price_inr ? (product.price_inr / 100).toString() : '',
      net_quantity: (product.net_quantity ?? 0).toString(),
      link_url: product.link_url || '',
      enquiry_form_id: product.enquiry_form_id || '',
      is_active: product.is_active ?? true
    })
    const mappedImages = (product.image_urls || []).map((url: string) => ({
      id: Math.random().toString(36).substring(2, 9),
      type: 'existing',
      url
    }))
    setProductImages(mappedImages)
    setDeletedExistingImageUrls([])
    setProductSheetOpen(true)
  }

  const openViewProduct = (product: any) => {
    setProductFormMode('view')
    setEditingProduct(product)
    setIsConfirmingProductDelete(false)
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price_inr: product.price_inr ? (product.price_inr / 100).toString() : '',
      net_quantity: (product.net_quantity ?? 0).toString(),
      link_url: product.link_url || '',
      enquiry_form_id: product.enquiry_form_id || '',
      is_active: product.is_active ?? true
    })
    const mappedImages = (product.image_urls || []).map((url: string) => ({
      id: Math.random().toString(36).substring(2, 9),
      type: 'existing',
      url
    }))
    setProductImages(mappedImages)
    setDeletedExistingImageUrls([])
    setProductSheetOpen(true)
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {!(profile?.plan === 'pro' || profile?.plan === 'business') ? (
        /* PRO gate */
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lock size={28} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Products — Pro Feature</h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
              Showcase products and services on your card page, track clicks, and export product analytics. Upgrade to Pro to unlock.
            </p>
          </div>
          <button
            onClick={() => {
              setUpgradeModalFeature('Products and Services Catalog')
              setUpgradeModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles size={14} /> Upgrade to Pro
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-end items-center">
            <div className="flex gap-2">
              <button onClick={handleExportProductsCSV} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer">
                <FileDown size={13} /> Export CSV
              </button>
              <button onClick={openAddProduct} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold transition-all shadow-md cursor-pointer">
                <Plus size={13} /> Add Product
              </button>
            </div>
          </div>

          {/* Catalog grid */}
          {profileProductsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <Loader2 size={24} className="animate-spin text-[#3f5ce6]" />
              <p className="text-xs text-muted-foreground">Loading products...</p>
            </div>
          ) : profileProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card border border-border border-dashed rounded-3xl p-6">
              <div className="w-12 h-12 rounded-xl bg-[#3f5ce6]/8 flex items-center justify-center text-[#3f5ce6]">
                <Package size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">No Products Showcased</h4>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                  Add products or services to showcase them on your card profile. You can also link lead forms for enquiries.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <button
                  onClick={openAddProduct}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Plus size={13} /> Add Showcase Product
                </button>
                {(() => {
                  const otherProducts = allAccountProducts.filter(p => p.profile_id !== activeProfile?.id)
                  return otherProducts.length > 0 && (
                    <button
                      onClick={openDuplicateFromOthersDialog}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer bg-card"
                    >
                      <Layers size={13} /> Duplicate from Another Profile
                    </button>
                  )
                })()}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profileProducts.map((p: any) => {
                const hasImages = p.image_urls && Array.isArray(p.image_urls) && p.image_urls.length > 0
                const linkedForm = p.enquiry_form_id ? leadForms.find(f => f.id === p.enquiry_form_id) : null
                return (
                  <div
                    key={p.id}
                    onClick={() => openViewProduct(p)}
                    className={`group bg-card border rounded-2xl overflow-hidden transition-all hover:shadow-lg flex flex-col justify-between cursor-pointer ${p.is_active ? 'border-border hover:border-[#3f5ce6]/30' : 'border-border/60 bg-muted/10 opacity-70'}`}
                  >
                    <div>
                      {hasImages ? (
                        <div className="h-40 relative overflow-hidden bg-muted border-b border-border">
                          <ProductCardCarousel imageUrls={p.image_urls} alt={p.name} />
                          {!p.is_active && (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-zinc-950/80 text-zinc-300 backdrop-blur-sm z-10">
                              Inactive
                            </span>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openDuplicateProductDialog(p); }}
                                  className={`absolute p-1.5 rounded-lg bg-background/80 hover:bg-background dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-border/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm backdrop-blur-sm z-20 ${!p.is_active ? 'top-2.5 left-2.5' : 'top-2.5 right-2.5'}`}
                                >
                                  <CopyPlus size={12} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Duplicate to another profile</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-[#3f5ce6]/8 to-indigo-600/4 flex items-center justify-center border-b border-border relative">
                          <Package size={36} className="text-[#3f5ce6]/30" />
                          {!p.is_active && (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-zinc-950/80 text-zinc-300 backdrop-blur-sm z-10">
                              Inactive
                            </span>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openDuplicateProductDialog(p); }}
                                  className={`absolute p-1.5 rounded-lg bg-background/80 hover:bg-background dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-border/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm backdrop-blur-sm z-20 ${!p.is_active ? 'top-2.5 left-2.5' : 'top-2.5 right-2.5'}`}
                                >
                                  <CopyPlus size={12} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Duplicate to another profile</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-foreground leading-tight">{p.name}</h4>
                          <span className="text-xs font-black text-[#3f5ce6] shrink-0">
                            {p.price_inr ? `₹${(p.price_inr / 100).toLocaleString('en-IN')}` : 'Price on Request'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{p.description || 'No description provided.'}</p>

                        {/* Info badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {p.net_quantity !== undefined && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md">
                              Qty: {p.net_quantity}
                            </span>
                          )}
                          {linkedForm && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 rounded-md flex items-center gap-1 max-w-[130px] truncate" title={linkedForm.form_name}>
                              <FileText size={9} className="shrink-0" /> {linkedForm.form_name}
                            </span>
                          )}
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-muted text-muted-foreground border border-border/10 rounded-md flex items-center gap-1 shrink-0" title="Views">
                            <Eye size={10} className="shrink-0 text-muted-foreground" /> {p.view_count || 0}
                          </span>
                        </div>

                        {/* Ratings row */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {renderStars(p.rating)}
                          {(() => {
                            const reviewsForThisProduct = productReviews.filter(r => r.product_id === p.id)
                            const reviewsCount = reviewsForThisProduct.length
                            return p.rating !== null && p.rating !== undefined ? (
                              <span className="text-[10px] font-black text-amber-500 dark:text-amber-400 animate-fadeIn">
                                {parseFloat(p.rating).toFixed(1)} / 5.0 ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-muted-foreground animate-fadeIn">
                                No ratings yet
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add placeholder button */}
              <button
                onClick={openAddProduct}
                className="border-2 border-dashed border-border rounded-2xl min-h-[220px] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] bg-card/45 hover:bg-card/90 transition-all cursor-pointer w-full"
              >
                <Plus size={24} />
                <span className="text-xs font-semibold">Add Showcase Product</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Product Sliding Sheet (Form and Details drawer) */}
      <Sheet open={productSheetOpen} onOpenChange={(open: boolean) => !open && setProductSheetOpen(false)}>
        <SheetContent className="!w-full sm:!max-w-2xl lg:!max-w-xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>
          <SheetTitle className="sr-only">Product Showcase Drawer</SheetTitle>
          <SheetDescription className="sr-only">Detailed view and setup for dynamic items inside profiles catalog.</SheetDescription>

          {/* Accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

          {productFormMode === 'view' && editingProduct ? (
            <>
              <SheetHeader className="pt-0.5 px-6 pb-3 border-b border-border dark:border-zinc-800 shrink-0 text-left">
                <div className="space-y-1">
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full font-black tracking-wider ${editingProduct.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25' : 'bg-zinc-550/10 text-zinc-500 border border-border'}`}>
                    {editingProduct.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <SheetTitle className="text-base font-extrabold text-foreground tracking-tight leading-tight mt-1">{editingProduct.name}</SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground/85 font-black text-[#3f5ce6]">
                    {editingProduct.price_inr ? `₹${(editingProduct.price_inr / 100).toLocaleString('en-IN')}` : 'Price on Request'}
                  </SheetDescription>
                </div>
              </SheetHeader>

              {/* Scrollable details wrapper */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                {editingProduct.image_urls && editingProduct.image_urls.length > 0 && (
                  <div className="h-56 relative rounded-2xl overflow-hidden border border-border bg-muted">
                    <ProductCardCarousel imageUrls={editingProduct.image_urls} alt={editingProduct.name} objectFit="contain" />
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Description</h4>
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-zinc-500/[0.01] dark:bg-zinc-950/20 p-3 rounded-xl border border-border/60">
                    {editingProduct.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Net Quantity Available</span>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{editingProduct.net_quantity ?? 0} units</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Linked Form integration</span>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {leadForms.find(f => f.id === editingProduct.enquiry_form_id)?.form_name || 'No Enquiry Form Linked'}
                    </p>
                  </div>
                </div>

                {/* Reviews */}
                <div className="space-y-4 border-t border-border dark:border-zinc-800 pt-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Reviews & Ratings</h4>
                    {editingProduct.rating !== null && editingProduct.rating !== undefined && (
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Based on {productReviews.filter(r => r.product_id === editingProduct.id).length} {productReviews.filter(r => r.product_id === editingProduct.id).length === 1 ? 'review' : 'reviews'}
                      </span>
                    )}
                  </div>

                  {productReviews.filter(r => r.product_id === editingProduct.id).length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {productReviews.filter(r => r.product_id === editingProduct.id).map((rev) => {
                        const initials = (rev.reviewer_name || 'Anonymous')
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()

                        const colors = [
                          'from-blue-500 to-indigo-655 text-white',
                          'from-purple-500 to-pink-655 text-white',
                          'from-emerald-500 to-teal-655 text-white',
                          'from-amber-500 to-orange-655 text-white',
                          'from-rose-500 to-red-655 text-white',
                          'from-sky-500 to-blue-655 text-white',
                        ]
                        let sum = 0
                        const name = rev.reviewer_name || 'Anonymous'
                        for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
                        const avatarBg = colors[sum % colors.length]

                        return (
                          <div key={rev.id} className="flex gap-3 bg-zinc-500/[0.02] dark:bg-zinc-950/25 p-3.5 rounded-2xl border border-border/40 dark:border-zinc-850/40 hover:border-border/60 transition-all duration-205">
                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black tracking-wider bg-gradient-to-br ${avatarBg} shadow-xs`}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5 text-left">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-foreground truncate">{rev.reviewer_name || 'Anonymous'}</span>
                                <span className="text-[10px] text-muted-foreground/60 shrink-0 font-medium">
                                  {new Date(rev.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {renderStars(rev.rating)}
                                <span className="text-[10px] font-black text-amber-500 ml-0.5">
                                  {parseFloat(rev.rating).toFixed(1)}
                                </span>
                              </div>
                              {rev.review && (
                                <p className="text-xs text-muted-foreground leading-relaxed italic bg-zinc-500/[0.01] dark:bg-zinc-950/45 px-2.5 py-1.5 rounded-xl border-l-2 border-[#3f5ce6] dark:border-indigo-500">
                                  "{rev.review}"
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/55 italic px-1 select-none">
                      No reviews have been provided.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end items-center">
                <div className="flex-1 text-[10px] text-muted-foreground/60 flex items-center gap-1 select-none pr-3">
                  <Eye size={10} className="text-muted-foreground" /> Views: {editingProduct?.view_count || 0}
                </div>
                <div className="flex gap-2 shrink-0 items-center animate-fadeIn">
                  {isConfirmingProductDelete ? (
                    <div className="flex items-center gap-1.5 shrink-0 bg-red-500/5 dark:bg-red-500/10 border border-red-500/25 p-1 rounded-xl transition-all">
                      <span className="text-[10px] font-bold text-red-500 dark:text-red-400 px-2 select-none">Confirm delete?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (editingProduct?.id) {
                            await confirmDeleteProduct(editingProduct.id)
                            setProductSheetOpen(false)
                            setIsConfirmingProductDelete(false)
                          }
                        }}
                        className="py-1 px-2.5 rounded-lg bg-red-650 text-white font-bold text-[10px] cursor-pointer hover:bg-red-700 transition-colors active:scale-95 shrink-0"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingProductDelete(false)}
                        className="py-1 px-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground font-bold text-[10px] cursor-pointer transition-colors active:scale-95 shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingProductDelete(true)}
                      className="py-2 px-3.5 rounded-xl border border-red-500/35 bg-red-500/5 hover:bg-red-550/10 dark:hover:bg-red-500/15 text-red-500 dark:text-red-400 font-semibold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setProductFormMode('edit')}
                    className="py-2 px-3.5 rounded-xl border border-border dark:border-zinc-800 bg-card hover:bg-muted text-foreground dark:text-white text-xs font-semibold cursor-pointer transition-all active:scale-98 flex items-center gap-1.5 shrink-0"
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductSheetOpen(false)}
                    className="py-2 px-3.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    Close
                  </button>
                </div>
              </SheetFooter>
            </>
          ) : (
            <form onSubmit={handleSaveProduct} className="flex flex-col h-full overflow-hidden">
              <SheetHeader className="pt-0.5 px-6 pb-3 border-b border-border dark:border-zinc-800/80 shrink-0 text-left">
                <div className="space-y-1">
                  <SheetTitle className="text-lg font-bold text-foreground dark:text-white">
                    {productFormMode === 'add' ? 'Showcase a New Product' : 'Edit Showcase Product'}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed font-medium">
                    {productFormMode === 'add'
                      ? 'Add product details, quantities, client reviews, external purchase links, and link enquiry forms.'
                      : 'Update product information, upload media, or configure enquiry forms.'}
                  </SheetDescription>
                </div>
              </SheetHeader>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                {/* Name field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Elite Metal NFC Card"
                    className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                  />
                </div>

                {/* Description field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="e.g. Premium laser-engraved matte black metal card with built-in NFC chip."
                    rows={6}
                    className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all resize-y min-h-[140px]"
                  />
                </div>

                {/* Pricing and Stock info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Price per Unit (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price_inr}
                      onChange={e => setProductForm(p => ({ ...p, price_inr: e.target.value }))}
                      placeholder="Leave blank for price on request"
                      className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Net Quantity Available</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.net_quantity}
                      onChange={e => setProductForm(p => ({ ...p, net_quantity: e.target.value }))}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                    />
                  </div>
                </div>

                {/* External Link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">External Purchase/Detail Link</label>
                  <input
                    type="url"
                    value={productForm.link_url}
                    onChange={e => setProductForm(p => ({ ...p, link_url: e.target.value }))}
                    placeholder="https://example.com/product"
                    className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                  />
                </div>

                {/* Enquiry form link */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Enquiry Form integration</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground flex items-center justify-between hover:bg-muted/30 transition-all cursor-pointer">
                            <span className="truncate">
                              {leadForms.find(f => f.id === productForm.enquiry_form_id)?.form_name || 'No Enquiry Form Linked'}
                            </span>
                            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[340px] p-1.5 bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-2xl shadow-xl z-[150]" align="start">
                          <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                            <DropdownMenuItem
                              onClick={() => setProductForm(p => ({ ...p, enquiry_form_id: '' }))}
                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-foreground hover:bg-muted dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between cursor-pointer focus:bg-muted dark:focus:bg-zinc-800/60 focus:text-foreground"
                            >
                              <span>No Enquiry Form (Disable Enquiry Button)</span>
                              {!productForm.enquiry_form_id && <Check size={14} className="text-[#3f5ce6]" />}
                            </DropdownMenuItem>
                            {leadForms.map(f => (
                              <DropdownMenuItem
                                key={f.id}
                                onClick={() => setProductForm(p => ({ ...p, enquiry_form_id: f.id }))}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-foreground hover:bg-muted dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between cursor-pointer focus:bg-muted dark:focus:bg-zinc-800/60 focus:text-foreground"
                              >
                                <span>{f.form_name}</span>
                                {productForm.enquiry_form_id === f.id && <Check size={14} className="text-[#3f5ce6]" />}
                              </DropdownMenuItem>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProductSheetOpen(false)
                        router.push('/dashboard/leads?newForm=true')
                      }}
                      className="px-3 rounded-xl border border-dashed border-border hover:border-[#3f5ce6]/40 text-[#3f5ce6] text-xs font-semibold hover:bg-[#3f5ce6]/5 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 select-none"
                    >
                      <Plus size={13} /> Create Form
                    </button>
                  </div>
                </div>

                {/* Visible switcher */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/10">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Visible on profile</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Showcase this product on your public NFC profile page</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductForm(p => ({ ...p, is_active: !p.is_active }))}
                    className={`w-10 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer ${productForm.is_active ? 'bg-[#3f5ce6] flex justify-end' : 'bg-zinc-300 dark:bg-zinc-700 flex justify-start'}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Upload images */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Images</label>
                  <div className="grid grid-cols-4 gap-3">
                    {productImages.map((img, index) => {
                      const url = img.type === 'existing' ? img.url : img.previewUrl
                      return (
                        <div key={img.id} className="relative aspect-square rounded-xl border border-border overflow-hidden bg-muted group animate-fadeIn">
                          <img src={url} alt="Product Image" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/55 backdrop-blur-xs flex items-center justify-between gap-1.5 z-10">
                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveProductImage(index, 'up'); }}
                                      disabled={index === 0}
                                      className="p-1 rounded bg-white/15 text-white hover:bg-white/35 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                    >
                                      <ChevronLeft size={11} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Move Left</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveProductImage(index, 'down'); }}
                                      disabled={index === productImages.length - 1}
                                      className="p-1 rounded bg-white/15 text-white hover:bg-white/35 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                    >
                                      <ChevronRight size={11} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Move Right</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProductImage(img.id); }}
                                    className="p-1 rounded bg-red-500/80 hover:bg-red-655 text-white transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Delete Image</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      )
                    })}

                    {/* Add Image Button */}
                    <label className="border-2 border-dashed border-border rounded-xl aspect-square flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] transition-all cursor-pointer select-none bg-card/25 hover:bg-card/90">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUploadProductImage}
                        className="hidden"
                        disabled={uploadingProductImages}
                      />
                      {uploadingProductImages ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Upload size={16} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                        </>
                      )}
                    </label>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 leading-normal">
                    Reorder images using arrows. The first image will be shown as primary.
                  </p>
                </div>

                {/* Manage Reviews (Only Delete Allowed) */}
                {productFormMode === 'edit' && (
                  <div className="space-y-4 border-t border-border dark:border-zinc-800 pt-5">
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Manage Product Reviews</h4>
                      <div className="space-y-2">
                        {productReviews.filter(r => r.product_id === editingProduct?.id).length > 0 ? (
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                            {productReviews.filter(r => r.product_id === editingProduct?.id).map((rev) => (
                              <div key={rev.id} className="flex items-start justify-between gap-3 bg-muted/20 dark:bg-zinc-900/20 p-2.5 rounded-xl border border-border/80 dark:border-zinc-800/80">
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground truncate">{rev.reviewer_name}</span>
                                    <div className="flex items-center gap-0.5">
                                      {renderStars(rev.rating)}
                                      <span className="text-[10px] font-black text-amber-500 ml-1">
                                        {parseFloat(rev.rating).toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                  {rev.review && (
                                    <p className="text-xs text-muted-foreground italic leading-normal pl-2 border-l border-border">
                                      "{rev.review}"
                                    </p>
                                  )}
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteReview(rev.id, editingProduct.id)}
                                        className="p-1.5 rounded-lg text-red-500 hover:text-red-650 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Delete Review</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/60 italic pl-1">
                            No client reviews added yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end">
                <button
                  type="button"
                  onClick={() => setProductSheetOpen(false)}
                  className="flex-grow py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productSaving || uploadingProductImages}
                  className="flex-grow py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {productSaving ? (
                    <><Loader2 size={13} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={13} /> {productFormMode === 'add' ? 'Create Product' : 'Save Changes'}</>
                  )}
                </button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══ PRODUCT DUPLICATE DIALOG ═══════════════════════════════════ */}
      {duplicateProductDialogOpen && duplicatingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
            <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Product</h3>
              <button onClick={() => setDuplicateProductDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Copy product details to another profile. Reviews and linked forms will not be copied over.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Profile</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                      <span className="truncate">
                        {cardProfiles.find((p: any) => p.id === duplicateProductTargetProfileId)?.profile_name || 'Select target profile'}
                      </span>
                      <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[340px] z-[150]">
                    {cardProfiles.filter((p: any) => p.id !== activeProfile?.id).map((p: any) => (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => {
                          setDuplicateProductTargetProfileId(p.id)
                          checkDuplicateProductConflict(duplicateProductName, p.id)
                        }}
                        className="text-xs cursor-pointer"
                      >
                        {p.profile_name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Name in Target Profile</label>
                <input
                  type="text"
                  value={duplicateProductName}
                  onChange={e => {
                    const newName = e.target.value
                    setDuplicateProductName(newName)
                    checkDuplicateProductConflict(newName, duplicateProductTargetProfileId)
                  }}
                  placeholder="Product name"
                  className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                />
              </div>

              {duplicateProductCheckingConflict ? (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse py-1">
                  <Loader2 size={11} className="animate-spin" /> Checking target duplicates...
                </div>
              ) : duplicateProductConflict ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> Product Already Present
                  </div>
                  <p className="leading-relaxed">
                    A product with this name already exists in that target profile. Duplicating will create a second instance of this product.
                  </p>
                </div>
              ) : null}
            </div>
            <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
              <button onClick={() => setDuplicateProductDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
              <button
                onClick={confirmDuplicateProduct}
                disabled={duplicatingProductProgress || !duplicateProductTargetProfileId || !duplicateProductName.trim()}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white ${duplicateProductConflict
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-[#3f5ce6] hover:bg-[#3050d8]'
                  }`}
              >
                {duplicatingProductProgress ? (
                  <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                ) : duplicateProductConflict ? (
                  <><AlertCircle size={12} /> Duplicate Anyway</>
                ) : (
                  <><Layers size={12} /> Duplicate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DUPLICATE FROM OTHERS DIALOG ═══════════════════════════ */}
      {duplicateFromOthersDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
            <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Product From Another Profile</h3>
              <button onClick={() => setDuplicateFromOthersDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select a product from another profile to duplicate it to your current active profile.
              </p>

              {/* Dropdown: Source Profile */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Source Profile</label>
                {(() => {
                  const sourceProfiles = cardProfiles.filter(profile =>
                    allAccountProducts.some(p => p.profile_id === profile.id) && profile.id !== activeProfile?.id
                  )
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                          <span className="truncate">
                            {sourceProfiles.find((p: any) => p.id === selectedSourceProfileId)?.profile_name || 'Select source profile'}
                          </span>
                          <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[340px] z-[150]">
                        {sourceProfiles.map((p: any) => (
                          <DropdownMenuItem
                            key={p.id}
                            onClick={() => {
                              setSelectedSourceProfileId(p.id)
                              const firstProduct = allAccountProducts.find(prod => prod.profile_id === p.id)
                              if (firstProduct) {
                                setSelectedSourceProductId(firstProduct.id)
                                setDuplicateFromOthersProductName(firstProduct.name || '')
                                if (activeProfile?.id) {
                                  checkDuplicateFromOthersConflict(firstProduct.name, activeProfile.id)
                                }
                              } else {
                                setSelectedSourceProductId('')
                                setDuplicateFromOthersProductName('')
                                setDuplicateFromOthersConflict(false)
                              }
                            }}
                            className="text-xs cursor-pointer"
                          >
                            {p.profile_name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                })()}
              </div>

              {/* Dropdown: Product */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Select Product to Copy</label>
                {(() => {
                  const sourceProducts = allAccountProducts.filter(p => p.profile_id === selectedSourceProfileId)
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button disabled={!selectedSourceProfileId} className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left disabled:opacity-50">
                          <span className="truncate">
                            {sourceProducts.find((p: any) => p.id === selectedSourceProductId)?.name || 'Select product'}
                          </span>
                          <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[340px] z-[150]">
                        {sourceProducts.map((prod: any) => (
                          <DropdownMenuItem
                            key={prod.id}
                            onClick={() => {
                              setSelectedSourceProductId(prod.id)
                              setDuplicateFromOthersProductName(prod.name || '')
                              if (activeProfile?.id) {
                                checkDuplicateFromOthersConflict(prod.name, activeProfile.id)
                              }
                            }}
                            className="text-xs cursor-pointer"
                          >
                            {prod.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                })()}
              </div>

              {/* Product name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Name in Current Profile</label>
                <input
                  type="text"
                  disabled={!selectedSourceProductId}
                  value={duplicateFromOthersProductName}
                  onChange={e => {
                    const newName = e.target.value
                    setDuplicateFromOthersProductName(newName)
                    if (activeProfile?.id) {
                      checkDuplicateFromOthersConflict(newName, activeProfile.id)
                    }
                  }}
                  placeholder="Product name"
                  className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all disabled:opacity-50"
                />
              </div>

              {duplicateFromOthersCheckingConflict ? (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse py-1">
                  <Loader2 size={11} className="animate-spin" /> Checking target duplicates...
                </div>
              ) : duplicateFromOthersConflict ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> Product Already Present
                  </div>
                  <p className="leading-relaxed">
                    A product with this name already exists in your current active profile. Duplicating will create a duplicate product.
                  </p>
                </div>
              ) : null}
            </div>
            <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
              <button onClick={() => setDuplicateFromOthersDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
              <button
                onClick={confirmDuplicateFromOthers}
                disabled={duplicatingFromOthersProgress || !selectedSourceProductId || !duplicateFromOthersProductName.trim()}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white ${duplicateFromOthersConflict ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#3f5ce6] hover:bg-[#3050d8]'}`}
              >
                {duplicatingFromOthersProgress ? (
                  <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                ) : duplicateFromOthersConflict ? (
                  <><AlertCircle size={12} /> Duplicate Anyway</>
                ) : (
                  <><Layers size={12} /> Duplicate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
