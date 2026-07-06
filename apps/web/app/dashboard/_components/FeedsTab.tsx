'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import {
  Lock, Sparkles, Plus, GripVertical, Activity, Archive, PenLine,
  Image as ImageIcon, Video, Link2, CopyPlus, SquarePen, Trash2,
  Loader2, Save, X, ChevronDown, ChevronLeft, ChevronRight, Upload, Layers
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

export function FeedsTab() {
  const {
    user,
    profile,
    activeCard,
    activeProfile,
    cardProfiles,
    profileFeeds,
    setProfileFeeds,
    profileFeedsLoading,
    allAccountFeeds,
    setAllAccountFeeds,
    setAllAccountFeedsLoading,
    setUpgradeModalOpen,
    setUpgradeModalFeature,
    setMessage,
    fetchProfileFeeds
  } = useDashboard()

  const supabase = createClient()
  const isAllCards = activeCard?.id === 'all'

  // Local States
  const [isReorderingFeeds, setIsReorderingFeeds] = useState(false)
  const [feedsFilterTab, setFeedsFilterTab] = useState<'active' | 'archived'>('active')
  const [feedImages, setFeedImages] = useState<any[]>([])
  const [feedDeletedExistingImageUrls, setFeedDeletedExistingImageUrls] = useState<string[]>([])
  const [feedVideo, setFeedVideo] = useState<any | null>(null)
  const [feedDeletedExistingVideoUrl, setFeedDeletedExistingVideoUrl] = useState<string | null>(null)
  
  const [editingFeed, setEditingFeed] = useState<any | null>(null)
  const [feedFormMode, setFeedFormMode] = useState<'add' | 'edit'>('add')
  const [feedForm, setFeedForm] = useState({
    feed_type: 'text' as 'text' | 'image' | 'video' | 'link',
    caption: '',
    media_url: '',
    link_url: '',
    link_title: '',
    is_published: true
  })

  const [feedSheetOpen, setFeedSheetOpen] = useState(false)
  const [feedSaving, setFeedSaving] = useState(false)
  const [uploadingFeedMedia, setUploadingFeedMedia] = useState(false)
  const [feedDeleting, setFeedDeleting] = useState<string | null>(null)
  const [feedPendingDelete, setFeedPendingDelete] = useState<string | null>(null)

  const [draggedFeedId, setDraggedFeedId] = useState<string | null>(null)
  const [dragOverFeedId, setDragOverFeedId] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})

  // Duplication States
  const [duplicatingFeed, setDuplicatingFeed] = useState<any | null>(null)
  const [duplicateFeedTargetProfileId, setDuplicateFeedTargetProfileId] = useState<string>('')
  const [duplicateFeedDialogOpen, setDuplicateFeedDialogOpen] = useState(false)
  const [duplicatingFeedProgress, setDuplicatingFeedProgress] = useState(false)

  const [duplicateFeedFromOthersDialogOpen, setDuplicateFeedFromOthersDialogOpen] = useState(false)
  const [selectedSourceFeedProfileId, setSelectedSourceFeedProfileId] = useState('')
  const [selectedSourceFeedId, setSelectedSourceFeedId] = useState('')
  const [duplicatingFeedFromOthersProgress, setDuplicatingFeedFromOthersProgress] = useState(false)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchAllAccountFeeds = async () => {
    if (!user?.id) return
    setAllAccountFeedsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_feeds')
        .select('*')
        .eq('account_id', user.id)
      if (error) throw error
      if (data) {
        setAllAccountFeeds(data)
      }
    } catch (err) {
      console.error('Failed to fetch all account feeds:', err)
    } finally {
      setAllAccountFeedsLoading(false)
    }
  }

  // ── Drag & Drop Handlers ──────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, feedId: string) => {
    setDraggedFeedId(feedId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', feedId)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedFeedId === targetId) return
    setDragOverFeedId(targetId)
  }

  const handleDragEnd = () => {
    setDraggedFeedId(null)
    setDragOverFeedId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedFeedId || draggedFeedId === targetId) return

    const draggedIndex = profileFeeds.findIndex((f: any) => f.id === draggedFeedId)
    const targetIndex = profileFeeds.findIndex((f: any) => f.id === targetId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const updatedFeeds = [...profileFeeds]
      const [draggedItem] = updatedFeeds.splice(draggedIndex, 1)
      updatedFeeds.splice(targetIndex, 0, draggedItem)
      handleFeedsReorder(updatedFeeds)
    }
    handleDragEnd()
  }

  const handleFeedsReorder = (newOrder: any[]) => {
    setProfileFeeds(newOrder)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const promises = newOrder.map((feed, index) =>
          supabase
            .from('profile_feeds')
            .update({ sort_order: index })
            .eq('id', feed.id)
        )
        await Promise.all(promises)
      } catch (err) {
        console.error('Feeds reorder error:', err)
      }
    }, 800)
  }

  // ── Duplicate Dialogs ────────────────────────────────────────────
  const openDuplicateFeedDialog = (feed: any) => {
    setDuplicatingFeed(feed)
    const firstOther = cardProfiles.find((p: any) => p.id !== activeProfile?.id)
    setDuplicateFeedTargetProfileId(firstOther ? firstOther.id : '')
    setDuplicateFeedDialogOpen(true)
  }

  const confirmDuplicateFeed = async () => {
    if (!duplicatingFeed || !duplicateFeedTargetProfileId || !user?.id) return
    setDuplicatingFeedProgress(true)
    try {
      const targetProfile = cardProfiles.find((p: any) => p.id === duplicateFeedTargetProfileId)
      const { error } = await supabase
        .from('profile_feeds')
        .insert({
          profile_id: duplicateFeedTargetProfileId,
          account_id: user.id,
          feed_type: duplicatingFeed.feed_type,
          caption: duplicatingFeed.caption || null,
          media_url: duplicatingFeed.media_url || null,
          media_urls: duplicatingFeed.media_urls || [],
          thumbnail_url: duplicatingFeed.thumbnail_url || null,
          link_url: duplicatingFeed.link_url || null,
          link_title: duplicatingFeed.link_title || null,
          is_published: false,
          sort_order: 0,
          reactions: { like: 0, love: 0, fire: 0, clap: 0 }
        })
      if (error) throw error
      setDuplicateFeedDialogOpen(false)
      fetchAllAccountFeeds()
      setMessage({ type: 'success', text: `Feed post duplicated to "${targetProfile?.profile_name || 'profile'}" successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate feed post.' })
    } finally {
      setDuplicatingFeedProgress(false)
    }
  }

  const openDuplicateFeedFromOthersDialog = () => {
    const sourceProfiles = cardProfiles.filter(profile =>
      allAccountFeeds.some(f => f.profile_id === profile.id) && profile.id !== activeProfile?.id
    )
    if (sourceProfiles.length > 0) {
      const firstProf = sourceProfiles[0]
      setSelectedSourceFeedProfileId(firstProf.id)
      const feedsForProf = allAccountFeeds.filter(f => f.profile_id === firstProf.id)
      if (feedsForProf.length > 0) {
        setSelectedSourceFeedId(feedsForProf[0].id)
      } else {
        setSelectedSourceFeedId('')
      }
    } else {
      setSelectedSourceFeedProfileId('')
      setSelectedSourceFeedId('')
    }
    setDuplicateFeedFromOthersDialogOpen(true)
  }

  const confirmDuplicateFeedFromOthers = async () => {
    if (!selectedSourceFeedId || !activeProfile?.id || !user?.id) return
    setDuplicatingFeedFromOthersProgress(true)
    try {
      const sourceFeed = allAccountFeeds.find(f => f.id === selectedSourceFeedId)
      if (!sourceFeed) throw new Error('Source feed not found')
      const { error } = await supabase
        .from('profile_feeds')
        .insert({
          profile_id: activeProfile.id,
          account_id: user.id,
          feed_type: sourceFeed.feed_type,
          caption: sourceFeed.caption || null,
          media_url: sourceFeed.media_url || null,
          media_urls: sourceFeed.media_urls || [],
          thumbnail_url: sourceFeed.thumbnail_url || null,
          link_url: sourceFeed.link_url || null,
          link_title: sourceFeed.link_title || null,
          is_published: false,
          sort_order: 0,
          reactions: { like: 0, love: 0, fire: 0, clap: 0 }
        })
      if (error) throw error
      setDuplicateFeedFromOthersDialogOpen(false)
      fetchAllAccountFeeds()
      fetchProfileFeeds(activeProfile.id)
      setMessage({ type: 'success', text: `Feed post duplicated successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate feed post.' })
    } finally {
      setDuplicatingFeedFromOthersProgress(false)
    }
  }

  // ── Feeds Add & Edit sheets ──────────────────────────────────────
  const openAddFeed = (type: 'text' | 'image' | 'video' | 'link' = 'text') => {
    setFeedFormMode('add')
    setEditingFeed(null)
    setFeedForm({
      feed_type: type,
      caption: '',
      media_url: '',
      link_url: '',
      link_title: '',
      is_published: true
    })
    setFeedImages([])
    setFeedDeletedExistingImageUrls([])
    setFeedVideo(null)
    setFeedDeletedExistingVideoUrl(null)
    setFeedSheetOpen(true)
  }

  const openEditFeed = (feed: any) => {
    setFeedFormMode('edit')
    setEditingFeed(feed)
    setFeedForm({
      feed_type: feed.feed_type || 'text',
      caption: feed.caption || '',
      media_url: feed.media_url || '',
      link_url: feed.link_url || '',
      link_title: feed.link_title || '',
      is_published: feed.is_published ?? true
    })

    if (feed.feed_type === 'image') {
      const urls = feed.media_urls && Array.isArray(feed.media_urls)
        ? feed.media_urls
        : (feed.media_url ? [feed.media_url] : [])
      setFeedImages(urls.map((url: string) => ({
        id: Math.random().toString(36).substring(2, 9),
        type: 'existing',
        url
      })))
      setFeedVideo(null)
    } else if (feed.feed_type === 'video') {
      if (feed.media_url) {
        setFeedVideo({
          id: Math.random().toString(36).substring(2, 9),
          type: 'existing',
          url: feed.media_url
        })
      } else {
        setFeedVideo(null)
      }
      setFeedImages([])
    } else {
      setFeedImages([])
      setFeedVideo(null)
    }

    setFeedDeletedExistingImageUrls([])
    setFeedDeletedExistingVideoUrl(null)
    setFeedSheetOpen(true)
  }

  const handleUploadFeedImage = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setFeedImages(prev => [...prev, ...newItems])
  }

  const handleDeleteFeedImage = (id: string) => {
    const target = feedImages.find(img => img.id === id)
    if (!target) return
    
    if (target.type === 'new' && target.previewUrl) {
      URL.revokeObjectURL(target.previewUrl)
    } else if (target.type === 'existing') {
      setFeedDeletedExistingImageUrls(prev => [...prev, target.url])
    }
    
    setFeedImages(prev => prev.filter(img => img.id !== id))
  }

  const moveFeedImage = (index: number, direction: 'up' | 'down') => {
    const list = [...feedImages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return
    const temp = list[index]
    list[index] = list[targetIndex]
    list[targetIndex] = temp
    setFeedImages(list)
  }

  const handleUploadFeedVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const previewUrl = URL.createObjectURL(file)
    
    if (feedVideo && feedVideo.type === 'new' && feedVideo.previewUrl) {
      URL.revokeObjectURL(feedVideo.previewUrl)
    } else if (feedVideo && feedVideo.type === 'existing') {
      setFeedDeletedExistingVideoUrl(feedVideo.url)
    }

    setFeedVideo({
      id: Math.random().toString(36).substring(2, 9),
      type: 'new',
      file,
      previewUrl
    })
  }

  const handleDeleteFeedVideo = () => {
    if (!feedVideo) return
    if (feedVideo.type === 'new' && feedVideo.previewUrl) {
      URL.revokeObjectURL(feedVideo.previewUrl)
    } else if (feedVideo.type === 'existing') {
      setFeedDeletedExistingVideoUrl(feedVideo.url)
    }
    setFeedVideo(null)
  }

  const handleSubmitFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProfile?.id || !user?.id) return
    setFeedSaving(true)
    try {
      let finalMediaUrl: string | null = feedForm.media_url || null
      let finalMediaUrls: string[] = []

      if (feedForm.feed_type === 'image') {
        setUploadingFeedMedia(true)
        // Upload new files
        for (const img of feedImages) {
          if (img.type === 'new' && img.file) {
            const fileExt = img.file.name.split('.').pop()
            const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
              .from('profile-feeds')
              .upload(filePath, img.file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
              .from('profile-feeds')
              .getPublicUrl(filePath)
            
            finalMediaUrls.push(publicUrl)
          } else if (img.type === 'existing' && img.url) {
            finalMediaUrls.push(img.url)
          }
        }

        // Delete removed existing files from storage
        for (const url of feedDeletedExistingImageUrls) {
          const isReferenced = allAccountFeeds.some(
            f => f.id !== editingFeed?.id && f.media_urls && Array.isArray(f.media_urls) && f.media_urls.includes(url)
          )
          if (!isReferenced && typeof url === 'string' && url.includes('/public/profile-feeds/')) {
            const parts = url.split('/public/profile-feeds/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('profile-feeds').remove([path])
            }
          }
        }
        
        finalMediaUrl = finalMediaUrls[0] || null
      } else if (feedForm.feed_type === 'video') {
        if (feedVideo && feedVideo.type === 'new' && feedVideo.file) {
          setUploadingFeedMedia(true)
          const fileExt = feedVideo.file.name.split('.').pop()
          const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
          const filePath = `${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('profile-feeds')
            .upload(filePath, feedVideo.file)
          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('profile-feeds')
            .getPublicUrl(filePath)
          
          finalMediaUrl = publicUrl
        } else if (feedVideo && feedVideo.type === 'existing') {
          finalMediaUrl = feedVideo.url
        } else {
          finalMediaUrl = null
        }

        if (feedDeletedExistingVideoUrl) {
          const isReferenced = allAccountFeeds.some(
            f => f.id !== editingFeed?.id && f.media_url === feedDeletedExistingVideoUrl
          )
          if (!isReferenced && feedDeletedExistingVideoUrl.includes('/public/profile-feeds/')) {
            const parts = feedDeletedExistingVideoUrl.split('/public/profile-feeds/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('profile-feeds').remove([path])
            }
          }
        }
      }

      const payload: any = {
        profile_id: activeProfile.id,
        account_id: user.id,
        feed_type: feedForm.feed_type,
        caption: feedForm.caption.trim() || null,
        media_url: ['image', 'video'].includes(feedForm.feed_type) ? finalMediaUrl || null : null,
        media_urls: feedForm.feed_type === 'image' ? finalMediaUrls : [],
        link_url: feedForm.feed_type === 'link' ? feedForm.link_url.trim() || null : null,
        link_title: feedForm.feed_type === 'link' ? feedForm.link_title.trim() || null : null,
        is_published: feedForm.is_published
      }

      if (feedFormMode === 'add') {
        const minSortOrder = profileFeeds.length > 0
          ? Math.min(...profileFeeds.map(f => f.sort_order ?? 0))
          : 0;
        payload.sort_order = minSortOrder - 1;

        const { data, error } = await supabase
          .from('profile_feeds')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setProfileFeeds(prev => [data, ...prev])
        setMessage({ type: 'success', text: 'Feed post created successfully!' })
      } else {
        const { data, error } = await supabase
          .from('profile_feeds')
          .update(payload)
          .eq('id', editingFeed.id)
          .select()
          .single()
        if (error) throw error
        setProfileFeeds(prev => prev.map(f => f.id === editingFeed.id ? data : f))
        setMessage({ type: 'success', text: 'Feed post updated successfully!' })
      }

      feedImages.forEach(img => {
        if (img.type === 'new' && img.previewUrl) URL.revokeObjectURL(img.previewUrl)
      })
      if (feedVideo && feedVideo.type === 'new' && feedVideo.previewUrl) {
        URL.revokeObjectURL(feedVideo.previewUrl)
      }

      fetchAllAccountFeeds()
      setFeedSheetOpen(false)
    } catch (err: any) {
      console.error('Failed to save feed post:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save feed post.' })
    } finally {
      setFeedSaving(false)
      setUploadingFeedMedia(false)
    }
  }

  const confirmDeleteFeed = async (id: string) => {
    setFeedDeleting(id)
    try {
      const feed = profileFeeds.find(f => f.id === id)
      const { error } = await supabase
        .from('profile_feeds')
        .delete()
        .eq('id', id)
      if (error) throw error

      if (feed?.feed_type === 'image' && feed.media_urls && Array.isArray(feed.media_urls)) {
        for (const url of feed.media_urls) {
          const isReferenced = allAccountFeeds.some(
            f => f.id !== id && f.media_urls && Array.isArray(f.media_urls) && f.media_urls.includes(url)
          )
          if (!isReferenced && typeof url === 'string' && url.includes('/public/profile-feeds/')) {
            const parts = url.split('/public/profile-feeds/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('profile-feeds').remove([path])
            }
          }
        }
      }

      if (feed?.media_url && typeof feed.media_url === 'string' && feed.media_url.includes('/public/profile-feeds/')) {
        const isReferenced = allAccountFeeds.some(
          f => f.id !== id && (f.media_url === feed.media_url || (f.media_urls && Array.isArray(f.media_urls) && f.media_urls.includes(feed.media_url)))
        )
        if (!isReferenced) {
          const parts = feed.media_url.split('/public/profile-feeds/')
          if (parts.length === 2 && parts[1]) {
            const path = decodeURIComponent(parts[1])
            await supabase.storage.from('profile-feeds').remove([path])
          }
        }
      }

      setProfileFeeds(prev => prev.filter(f => f.id !== id))
      fetchAllAccountFeeds()
      setMessage({ type: 'success', text: 'Feed post deleted successfully!' })
    } catch (err: any) {
      console.error('Failed to delete feed post:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete feed post.' })
    } finally {
      setFeedDeleting(null)
      setFeedPendingDelete(null)
    }
  }

  const handleIncrementReaction = async (feedId: string, reactionType: string) => {
    const feed = profileFeeds.find(f => f.id === feedId)
    if (!feed) return
    
    const currentReactions = { ...feed.reactions }
    currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1
    
    setProfileFeeds(prev => prev.map(f => f.id === feedId ? { ...f, reactions: currentReactions } : f))
    
    try {
      const { error } = await supabase
        .from('profile_feeds')
        .update({ reactions: currentReactions })
        .eq('id', feedId)
      if (error) throw error
    } catch (err) {
      console.error('Failed to update reaction:', err)
      setProfileFeeds(prev => prev.map(f => f.id === feedId ? feed : f))
    }
  }

  // Render method
  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {!(profile?.plan === 'pro' || profile?.plan === 'business') ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lock size={28} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Feeds — Pro Feature</h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
              Post images, videos, text, and links to your card page feed. Keep your audience engaged with fresh content. Upgrade to Pro to unlock.
            </p>
          </div>
          <button
            onClick={() => {
              setUpgradeModalFeature('Feeds')
              setUpgradeModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles size={14} /> Upgrade to Pro
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-end items-center flex-wrap gap-3">
            {isReorderingFeeds ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="italic font-medium">Changes synced live</span>
                </div>
                <button
                  onClick={() => setIsReorderingFeeds(false)}
                  className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-900 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  Done
                </button>
              </div>
            ) : (
              profileFeeds.length > 0 && (
                <div className="flex items-center gap-2">
                  {profileFeeds.length > 1 && (
                    <button
                      onClick={() => setIsReorderingFeeds(true)}
                      className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                    >
                      <GripVertical size={14} className="text-muted-foreground" />
                      <span>Reorder</span>
                    </button>
                  )}
                  <button
                    onClick={() => openAddFeed('text')}
                    className="px-4 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                  >
                    <Plus size={14} />
                    <span>New Post</span>
                  </button>
                </div>
              )
            )}
          </div>

          {profileFeedsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/10 border border-border/80 rounded-2xl">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
              <p className="text-xs text-muted-foreground mt-2">Loading feed posts...</p>
            </div>
          ) : profileFeeds.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-6 bg-muted/5 w-full">
              <div className="w-14 h-14 rounded-2xl bg-[#3f5ce6]/5 dark:bg-[#3f5ce6]/10 flex items-center justify-center text-[#3f5ce6] border border-[#3f5ce6]/10 shadow-xs animate-pulse">
                <Activity size={26} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-foreground">No posts yet</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Share updates, media, and links to keep your NFC profile page fresh and engaging.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Create First Post</span>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {[
                    { type: 'text', label: 'Text Post', icon: PenLine },
                    { type: 'image', label: 'Image Post', icon: ImageIcon },
                    { type: 'video', label: 'Video Post', icon: Video },
                    { type: 'link', label: 'Link Post', icon: Link2 }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.type}
                        onClick={() => openAddFeed(item.type as any)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer shadow-sm hover:border-[#3f5ce6]/30 active:scale-98"
                      >
                        <IconComponent size={14} className="text-muted-foreground" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
                {(() => {
                  const otherFeeds = allAccountFeeds.filter(f => f.profile_id !== activeProfile?.id);
                  return otherFeeds.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/60 w-full max-w-xs flex justify-center">
                      <button
                        onClick={openDuplicateFeedFromOthersDialog}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer w-full justify-center hover:border-[#3f5ce6]/30 active:scale-98"
                      >
                        <Layers size={13} /> Duplicate from Another Profile
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (() => {
            const archivedFeedsCount = profileFeeds.filter(feed => !feed.is_published).length;
            const activeFeedsCount = profileFeeds.filter(feed => feed.is_published).length;
            const filteredFeeds = profileFeeds.filter(feed => 
              feedsFilterTab === 'active' ? feed.is_published : !feed.is_published
            )

            return (
              <>
                {/* Feeds Sub-tabs: Active vs Archived */}
                <div className="flex border-b border-border/60 pb-px gap-6 mt-2 mb-6">
                  <button
                    onClick={() => setFeedsFilterTab('active')}
                    className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${feedsFilterTab === 'active' ? 'text-[#3f5ce6]' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <span>Active Feeds</span>
                    {activeFeedsCount > 0 && (
                      <span className={`px-1.5 py-px rounded-full text-[10px] font-semibold ${feedsFilterTab === 'active' ? 'bg-[#3f5ce6]/10 text-[#3f5ce6]' : 'bg-muted text-muted-foreground'}`}>
                        {activeFeedsCount}
                      </span>
                    )}
                    {feedsFilterTab === 'active' && (
                      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#3f5ce6] rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setFeedsFilterTab('archived')}
                    className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${feedsFilterTab === 'archived' ? 'text-zinc-500' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <span>Archive</span>
                    {archivedFeedsCount > 0 && (
                      <span className={`px-1.5 py-px rounded-full text-[10px] font-semibold ${feedsFilterTab === 'archived' ? 'bg-zinc-500/10 text-zinc-500' : 'bg-muted text-muted-foreground'}`}>
                        {archivedFeedsCount}
                      </span>
                    )}
                    {feedsFilterTab === 'archived' && (
                      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-zinc-500 rounded-full" />
                    )}
                  </button>
                </div>

                {filteredFeeds.length === 0 ? (
                  <div className="border border-dashed border-border/80 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-4 bg-muted/5 w-full">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground border border-border/50">
                      <Archive size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground">
                        {feedsFilterTab === 'active' ? 'No active feed posts' : 'Archive is empty'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
                        {feedsFilterTab === 'active'
                          ? 'Create a new post or restore posts from the Archive.'
                          : 'Inactive or archived posts will be listed here.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Feed grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredFeeds.map((feed) => {
                      const formattedTime = new Date(feed.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' });
                      return (
                        <div 
                          key={feed.id}
                          draggable={isReorderingFeeds}
                          onDragStart={(e) => handleDragStart(e, feed.id)}
                          onDragOver={(e) => handleDragOver(e, feed.id)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, feed.id)}
                          className={`bg-card border rounded-2xl overflow-hidden flex flex-col justify-between relative select-none transition-all duration-200 ${
                            isReorderingFeeds 
                              ? `cursor-grab active:cursor-grabbing border-dashed ${
                                  draggedFeedId === feed.id 
                                    ? 'opacity-30 border-[#3f5ce6] scale-98 bg-[#3f5ce6]/5' 
                                    : dragOverFeedId === feed.id 
                                      ? 'border-[#3f5ce6] border-2 scale-97 bg-[#3f5ce6]/5 opacity-60' 
                                      : 'border-[#3f5ce6]/45 hover:border-[#3f5ce6] dark:border-[#3f5ce6]/45 hover:scale-[1.015] hover:shadow-lg'
                                }`
                              : 'border-border hover:border-[#3f5ce6]/30 group'
                          }`}
                        >
                          {isReorderingFeeds && (
                            <div className="absolute top-3 right-3 bg-[#3f5ce6] text-white border border-white/20 px-2 py-1 rounded-xl flex items-center gap-1.5 shadow-lg z-30 select-none pointer-events-none">
                              <GripVertical size={11} className="text-white/80" />
                              <span className="text-[9px] font-mono font-black">
                                {String(profileFeeds.indexOf(feed) + 1).padStart(2, '0')}
                              </span>
                            </div>
                          )}
                          {!isReorderingFeeds && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openDuplicateFeedDialog(feed); }}
                                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 hover:bg-background dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-border/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm backdrop-blur-sm z-30 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                  <CopyPlus size={12} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Duplicate to another profile</TooltipContent>
                            </Tooltip>
                          )}
                          <div className={isReorderingFeeds ? "pointer-events-none select-none" : ""}>
                            <div>
                              {feed.feed_type === 'image' && (feed.media_urls?.length || feed.media_url) && (() => {
                                const urls = feed.media_urls && feed.media_urls.length > 0 ? feed.media_urls : [feed.media_url];
                                return (
                                  <div className="relative overflow-hidden bg-muted border-b border-border">
                                    {urls.length === 1 ? (
                                      <img
                                        src={urls[0]}
                                        alt="Feed media"
                                        onLoad={(e) => {
                                          const { naturalWidth, naturalHeight } = e.currentTarget;
                                          setImageDimensions(prev => ({
                                            ...prev,
                                            [feed.id]: { width: naturalWidth, height: naturalHeight }
                                          }));
                                        }}
                                        className="w-full h-auto block object-contain transition-transform group-hover:scale-102 duration-300"
                                      />
                                    ) : (
                                      <div
                                        className="w-full relative overflow-hidden bg-muted"
                                        style={{
                                          aspectRatio: imageDimensions[feed.id]
                                            ? `${imageDimensions[feed.id].width} / ${imageDimensions[feed.id].height}`
                                            : '16/9'
                                        }}
                                      >
                                        <img
                                          src={urls[0]}
                                          alt="invisible loader"
                                          className="hidden"
                                          onLoad={(e) => {
                                            const { naturalWidth, naturalHeight } = e.currentTarget;
                                            setImageDimensions(prev => ({
                                              ...prev,
                                              [feed.id]: { width: naturalWidth, height: naturalHeight }
                                            }));
                                          }}
                                        />
                                        <ProductCardCarousel
                                          imageUrls={urls}
                                          alt="Feed media"
                                          objectFit="contain"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                              {feed.feed_type === 'video' && feed.media_url && (
                                <div className="relative overflow-hidden bg-muted border-b border-border">
                                  <video
                                    src={feed.media_url}
                                    autoPlay
                                    muted
                                    playsInline
                                    controls
                                    onLoadedMetadata={(e) => {
                                      const { videoWidth, videoHeight } = e.currentTarget;
                                      setImageDimensions(prev => ({
                                        ...prev,
                                        [feed.id]: { width: videoWidth, height: videoHeight }
                                      }));
                                    }}
                                    className="w-full h-auto block"
                                  />
                                </div>
                              )}
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">
                                      {feed.feed_type}
                                    </span>
                                    {!feed.is_published && (
                                      <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-500/10 px-1.5 py-0.5 rounded border border-zinc-500/20 flex items-center gap-1">
                                        <Archive size={8} />
                                        <span>Archived</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-muted-foreground/70">{formattedTime}</span>
                                </div>

                                {feed.caption && (
                                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap text-left font-semibold">
                                    {feed.caption}
                                  </p>
                                )}

                                {feed.feed_type === 'link' && feed.link_url && (
                                  <div className="p-2.5 rounded-xl border border-border/80 bg-muted/10 flex items-start gap-2.5 text-left group/link">
                                    <Link2 size={13} className="text-[#3f5ce6] shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-grow">
                                      {feed.link_title && (
                                        <p className="text-xs font-bold text-foreground truncate group-hover/link:text-[#3f5ce6] transition-colors">
                                          {feed.link_title}
                                        </p>
                                      )}
                                      <a 
                                        href={feed.link_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[10px] text-muted-foreground font-mono truncate block hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {feed.link_url}
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reactions & Actions Footer */}
                          {!isReorderingFeeds && (
                            <div className="p-4 pt-0 border-t border-border/20 mt-2 space-y-3">
                              {/* Reactions Bar */}
                              <div className="flex flex-wrap gap-1.5 pt-3">
                                {[
                                  { type: 'like', emoji: '👍' },
                                  { type: 'love', emoji: '❤️' },
                                  { type: 'fire', emoji: '🔥' },
                                  { type: 'clap', emoji: '🎉' }
                                ].map((react) => {
                                  const reactionsObj = feed.reactions || {};
                                  const count = reactionsObj[react.type] || 0;
                                  return (
                                    <button
                                      key={react.type}
                                      onClick={(e) => { e.stopPropagation(); handleIncrementReaction(feed.id, react.type); }}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all hover:bg-[#3f5ce6]/5 hover:border-[#3f5ce6]/20 cursor-pointer ${count > 0 ? 'bg-[#3f5ce6]/5 border-[#3f5ce6]/25 text-[#3f5ce6]' : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'}`}
                                    >
                                      <span className="text-[11px] leading-none">{react.emoji}</span>
                                      <span>{count}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Edit & Delete Controls */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditFeed(feed); }}
                                  className="flex-grow py-1 rounded-lg border border-border hover:bg-muted text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-98"
                                >
                                  <SquarePen size={11} /> Edit
                                </button>
                                {feedPendingDelete === feed.id ? (
                                  <div className="flex items-center gap-1 bg-red-500/5 border border-red-500/25 p-0.5 rounded-lg">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); confirmDeleteFeed(feed.id); }}
                                      disabled={feedDeleting === feed.id}
                                      className="py-1 px-2 rounded bg-red-500 hover:bg-red-650 text-white text-[9px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                    >
                                      {feedDeleting === feed.id ? 'Deleting...' : 'Confirm'}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setFeedPendingDelete(null); }}
                                      className="py-1 px-2 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-[9px] font-bold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setFeedPendingDelete(feed.id); }}
                                    className="py-1 px-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-650 transition-all cursor-pointer flex items-center justify-center active:scale-98"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )
          })()}
        </>
      )}

      {/* Add / Edit Feed Post Sliding Sheet Panel */}
      <Sheet open={feedSheetOpen} onOpenChange={(open: boolean) => {
        if (!open) setFeedSheetOpen(false);
      }}>
        <SheetContent className="!w-full sm:!max-w-2xl lg:!max-w-xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

          <SheetHeader className="pt-0.5 px-6 pb-3 border-b border-border dark:border-zinc-800/80 shrink-0">
            <div className="space-y-1">
              <SheetTitle className="text-lg font-bold text-foreground dark:text-white">
                {feedFormMode === 'add' ? 'Add Feed Post' : 'Edit Feed Post'}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed font-medium">
                {feedFormMode === 'add' ? 'Create a new update, media highlight, or link to showcase on your page.' : 'Modify your feed post details.'}
              </SheetDescription>
            </div>
          </SheetHeader>

          <form onSubmit={handleSubmitFeed} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Post Type</label>
                <div className="flex gap-2">
                  {[
                    { type: 'text', label: 'Text', icon: PenLine },
                    { type: 'image', label: 'Image', icon: ImageIcon },
                    { type: 'video', label: 'Video', icon: Video },
                    { type: 'link', label: 'Link', icon: Link2 }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isActive = feedForm.feed_type === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setFeedForm(prev => ({ ...prev, feed_type: item.type as any }))}
                        className={`flex-grow py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 ${isActive ? 'bg-[#3f5ce6]/10 border-[#3f5ce6] text-[#3f5ce6]' : 'border-border bg-card hover:bg-muted text-foreground'}`}
                      >
                        <IconComponent size={13} className={isActive ? 'text-[#3f5ce6]' : 'text-muted-foreground'} />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Caption / Post Text</label>
                <textarea
                  value={feedForm.caption}
                  onChange={e => setFeedForm(p => ({ ...p, caption: e.target.value }))}
                  placeholder="What's on your mind? Add caption or post body text here..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all resize-y min-h-[120px]"
                />
              </div>

              {feedForm.feed_type === 'image' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Feed Images (List of Images)</label>
                  <div className="grid grid-cols-4 gap-3">
                    {feedImages.map((img, index) => {
                      const url = img.type === 'existing' ? img.url : img.previewUrl
                      return (
                        <div key={img.id} className="relative aspect-square rounded-xl border border-border overflow-hidden bg-muted group animate-fadeIn">
                          <img src={url} alt="Feed Image" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/55 backdrop-blur-xs flex items-center justify-between gap-1.5 z-10">
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveFeedImage(index, 'up'); }}
                                    disabled={index === 0}
                                    className="p-1 rounded bg-white/15 text-white hover:bg-white/35 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                  >
                                    <ChevronLeft size={11} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Move Left</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveFeedImage(index, 'down'); }}
                                    disabled={index === feedImages.length - 1}
                                    className="p-1 rounded bg-white/15 text-white hover:bg-white/35 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                  >
                                    <ChevronRight size={11} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Move Right</TooltipContent>
                              </Tooltip>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteFeedImage(img.id); }}
                                  className="p-1 rounded bg-red-500/80 hover:bg-red-650 text-white transition-colors cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Delete Image</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      )
                    })}

                    <label className="border-2 border-dashed border-border rounded-xl aspect-square flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] transition-all cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUploadFeedImage}
                        className="hidden"
                      />
                      <Upload size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 leading-normal">
                    Add multiple images to showcase a scrollable card carousel on your profile. The first image is primary.
                  </p>
                </div>
              )}

              {feedForm.feed_type === 'video' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Feed Video</label>
                  {feedVideo ? (
                    <div className="relative aspect-video rounded-xl border border-border overflow-hidden bg-muted group max-w-sm">
                      {feedVideo.type === 'existing' ? (
                        <video src={feedVideo.url} controls className="w-full h-full object-cover" />
                      ) : (
                        <video src={feedVideo.previewUrl} controls className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-2 right-2 z-10">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteFeedVideo(); }}
                              className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-650 text-white transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Remove Video</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-border rounded-xl w-full h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] transition-all cursor-pointer bg-card/20">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleUploadFeedVideo}
                        className="hidden"
                      />
                      <Upload size={20} />
                      <span className="text-xs font-semibold">Select Video File</span>
                    </label>
                  )}
                </div>
              )}

              {feedForm.feed_type === 'link' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Link URL</label>
                    <input
                      type="url"
                      value={feedForm.link_url}
                      onChange={e => setFeedForm(p => ({ ...p, link_url: e.target.value }))}
                      placeholder="https://example.com/page"
                      required={feedForm.feed_type === 'link'}
                      className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Link Title</label>
                    <input
                      type="text"
                      value={feedForm.link_title}
                      onChange={e => setFeedForm(p => ({ ...p, link_title: e.target.value }))}
                      placeholder="e.g. Read Our Blog"
                      className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/10">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Active Status</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Toggle to publish instantly or move to archive</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedForm(p => ({ ...p, is_published: !p.is_published }))}
                  className={`w-10 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer ${feedForm.is_published ? 'bg-[#3f5ce6] flex justify-end' : 'bg-zinc-300 dark:bg-zinc-700 flex justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>

            <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end">
              <button
                type="button"
                onClick={() => setFeedSheetOpen(false)}
                className="flex-grow py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={feedSaving || uploadingFeedMedia}
                className="flex-grow py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {feedSaving || uploadingFeedMedia ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={13} /> {feedFormMode === 'add' ? 'Create Post' : 'Save Changes'}
                  </>
                )}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ═══ FEED DUPLICATE DIALOG ═══════════════════════════════════ */}
      {duplicateFeedDialogOpen && duplicatingFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
            <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Feed Post</h3>
              <button onClick={() => setDuplicateFeedDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Copy this feed post details to another profile. Post reactions will not be copied over. The duplicated post will be archived (draft status) on the target profile.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Profile</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                      <span className="truncate">
                        {cardProfiles.find((p: any) => p.id === duplicateFeedTargetProfileId)?.profile_name || 'Select target profile'}
                      </span>
                      <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[340px] z-[150]">
                    {cardProfiles.filter((p: any) => p.id !== activeProfile?.id).map((p: any) => (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => setDuplicateFeedTargetProfileId(p.id)}
                        className="text-xs cursor-pointer"
                      >
                        {p.profile_name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                <div className="font-bold text-foreground capitalize flex items-center gap-1">
                  Post Preview ({duplicatingFeed.feed_type})
                </div>
                <p className="line-clamp-3 leading-relaxed">
                  {duplicatingFeed.caption || '(No caption)'}
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
              <button onClick={() => setDuplicateFeedDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
              <button
                onClick={confirmDuplicateFeed}
                disabled={duplicatingFeedProgress || !duplicateFeedTargetProfileId}
                className="flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white bg-[#3f5ce6] hover:bg-[#3050d8] disabled:opacity-50"
              >
                {duplicatingFeedProgress ? (
                  <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                ) : (
                  <><Layers size={12} /> Duplicate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FEED DUPLICATE FROM OTHERS DIALOG ═══════════════════════ */}
      {duplicateFeedFromOthersDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
            <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Feed From Another Profile</h3>
              <button onClick={() => setDuplicateFeedFromOthersDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select a feed post from another profile to duplicate it to your current active profile.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Source Profile</label>
                {(() => {
                  const sourceProfiles = cardProfiles.filter(profile =>
                    allAccountFeeds.some(f => f.profile_id === profile.id) && profile.id !== activeProfile?.id
                  )
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                          <span className="truncate">
                            {sourceProfiles.find((p: any) => p.id === selectedSourceFeedProfileId)?.profile_name || 'Select source profile'}
                          </span>
                          <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[340px] z-[150]">
                        {sourceProfiles.map((p: any) => (
                          <DropdownMenuItem
                            key={p.id}
                            onClick={() => {
                              setSelectedSourceFeedProfileId(p.id)
                              const firstFeed = allAccountFeeds.find(f => f.profile_id === p.id)
                              if (firstFeed) {
                                setSelectedSourceFeedId(firstFeed.id)
                              } else {
                                setSelectedSourceFeedId('')
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Select Feed Post to Copy</label>
                {(() => {
                  const sourceFeeds = allAccountFeeds.filter(f => f.profile_id === selectedSourceFeedProfileId)
                  const selectedFeed = sourceFeeds.find(f => f.id === selectedSourceFeedId)
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button disabled={!selectedSourceFeedProfileId} className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left disabled:opacity-50">
                          <span className="truncate">
                            {selectedFeed ? `${selectedFeed.feed_type.toUpperCase()}: ${selectedFeed.caption ? selectedFeed.caption.substring(0, 30) + '...' : '(No Caption)'}` : 'Select post'}
                          </span>
                          <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[340px] z-[150]">
                        {sourceFeeds.map((feed: any) => (
                          <DropdownMenuItem
                            key={feed.id}
                            onClick={() => setSelectedSourceFeedId(feed.id)}
                            className="text-xs cursor-pointer"
                          >
                            <div className="flex flex-col text-left gap-0.5">
                              <span className="font-bold text-[10px] uppercase text-[#3f5ce6]">{feed.feed_type}</span>
                              <span className="truncate max-w-[300px]">{feed.caption || '(No caption)'}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                })()}
              </div>
            </div>
            <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
              <button onClick={() => setDuplicateFeedFromOthersDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
              <button
                onClick={confirmDuplicateFeedFromOthers}
                disabled={duplicatingFeedFromOthersProgress || !selectedSourceFeedId}
                className="flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white bg-[#3f5ce6] hover:bg-[#3050d8] disabled:opacity-50"
              >
                {duplicatingFeedFromOthersProgress ? (
                  <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
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
