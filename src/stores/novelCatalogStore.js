import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/boot/axios'
import { defaultNovels, categoryOptions, adaptOptions } from '@/data/novels'

const DEMO_ACCOUNTS = [
  {
    username: 'user',
    password: '123456',
    displayName: 'ผู้อ่านทั่วไป (User)',
    role: 'user',
  },
  {
    username: 'admin',
    password: '123456',
    displayName: 'ผู้ดูแลระบบ (Admin)',
    role: 'admin',
  },
]

const CATEGORY_MAP = {
  bl: 'bl',
  'Boy Love (วาย)': 'bl',
  fantasy: 'fantasy',
  แฟนตาซี: 'fantasy',
  'แฟนตาซี ผจญภัย & ต่างโลก': 'fantasy',
  mystery: 'mystery',
  สืบสวนสอบสวน: 'mystery',
  'สืบสวน ปริศนา & ระทึกขวัญ': 'mystery',
  school: 'school',
  ชีวิตในรั้วโรงเรียน: 'school',
  'โรงเรียน & วัยรุ่น': 'school',
  food: 'food',
  ทำอาหาร: 'food',
  'อาหาร & กวนกระเพาะ': 'food',
  romance: 'romance',
  'ย้อนยุค / โรแมนซ์': 'romance',
  'ย้อนยุค & โรแมนติก': 'romance',
}

const SORT_OPTIONS = [
  { label: 'ค่าเริ่มต้น (ตามคลัง)', value: 'default' },
  { label: 'คะแนนสูงสุด → ต่ำสุด', value: 'rating_desc' },
  { label: 'ยอดอ่านสูงสุด → ต่ำสุด', value: 'views_desc' },
  { label: 'ปีที่ออกใหม่สุด → เก่าสุด', value: 'year_desc' },
  { label: 'ปีที่ออกเก่าสุด → ใหม่สุด', value: 'year_asc' },
]

function resolveResourcePath(path) {
  const base = String(api.defaults.baseURL || '').replace(/\/+$/, '')
  if (base.endsWith(path)) {
    return ''
  }
  return path
}

function normalizeCategory(val) {
  const key = String(val || '').trim()
  return CATEGORY_MAP[key] || categoryOptions[0]?.value || 'bl'
}

function normalizeNovel(item) {
  return {
    ...item,
    id: String(item.id),
    category: normalizeCategory(item.category),
    status: item.status || 'published',
  }
}

function parseViewsToNumber(viewsVal) {
  if (typeof viewsVal === 'number') return viewsVal
  const str = String(viewsVal || '0')
    .replace(/,/g, '')
    .trim()
    .toUpperCase()
  const num = parseFloat(str) || 0
  if (str.endsWith('B')) return num * 1_000_000_000
  if (str.endsWith('M')) return num * 1_000_000
  if (str.endsWith('K')) return num * 1_000
  return num
}

function parseNumberSafe(val, fallback = 0) {
  const cleaned = String(val ?? '').replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(cleaned)
  return Number.isNaN(parsed) ? fallback : parsed
}

export const useNovelCatalogStore = defineStore('novelCatalog', () => {
  const isAuthenticated = ref(false)
  const currentUser = ref(null)
  const currentRole = ref('user')

  const siteName = ref(import.meta.env.QCLI_APP_TITLE || 'NOVELSTREAM')
  const novels = ref([])
  const searchKeyword = ref('')
  const activeCategory = ref('all')
  const activeAdapt = ref('all')
  const activeStatus = ref('all')
  const sortBy = ref('default')
  const sortOptions = ref(SORT_OPTIONS)
  const isLoading = ref(false)

  const isAdmin = computed(() => isAuthenticated.value && currentRole.value === 'admin')

  const categoryFilterList = computed(() => [{ label: 'ทั้งหมด', value: 'all' }, ...categoryOptions])

  const adaptFilterList = computed(() => [{ label: 'ทุกการดัดแปลง', value: 'all' }, ...adaptOptions])

  function getCategoryLabel(categoryValue) {
    const normalized = normalizeCategory(categoryValue)
    return categoryOptions.find((opt) => opt.value === normalized)?.label || categoryValue
  }

  const filteredNovels = computed(() => {
    const list = novels.value.filter((novel) => {
      if (!isAdmin.value && novel.status !== 'published') {
        return false
      }

      if (isAdmin.value && activeStatus.value !== 'all' && novel.status !== activeStatus.value) {
        return false
      }

      if (
        activeCategory.value !== 'all' &&
        normalizeCategory(novel.category) !== activeCategory.value
      ) {
        return false
      }

      if (activeAdapt.value !== 'all') {
        if (activeAdapt.value === 'series' && !novel.hasSeries) return false
        if (activeAdapt.value === 'anime' && !novel.hasAnime) return false
        if (activeAdapt.value === 'movie' && !novel.hasMovie) return false
      }

      const q = searchKeyword.value.trim().toLowerCase()
      if (q) {
        const hitTitle = (novel.title || '').toLowerCase().includes(q)
        const hitSynopsis = (novel.synopsis || '').toLowerCase().includes(q)
        const hitTags = Array.isArray(novel.tags)
          ? novel.tags.some((t) => String(t).toLowerCase().includes(q))
          : false
        if (!hitTitle && !hitSynopsis && !hitTags) return false
      }

      return true
    })

    if (sortBy.value === 'rating_desc') {
      return [...list].sort((a, b) => parseNumberSafe(b.rating) - parseNumberSafe(a.rating))
    }
    if (sortBy.value === 'views_desc') {
      return [...list].sort((a, b) => parseViewsToNumber(b.views) - parseViewsToNumber(a.views))
    }
    if (sortBy.value === 'year_desc') {
      return [...list].sort((a, b) => parseNumberSafe(b.year) - parseNumberSafe(a.year))
    }
    if (sortBy.value === 'year_asc') {
      return [...list].sort((a, b) => parseNumberSafe(a.year) - parseNumberSafe(b.year))
    }

    return list
  })

  const totalNovelsCount = computed(() => novels.value.length)
  const displayedNovelsCount = computed(() => filteredNovels.value.length)

  function login(username, password) {
    const cleanUser = (username || '').trim().toLowerCase()
    const cleanPass = (password || '').trim()

    const matched = DEMO_ACCOUNTS.find(
      (acc) => acc.username.toLowerCase() === cleanUser && acc.password === cleanPass,
    )

    if (!matched) {
      return { ok: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
    }

    isAuthenticated.value = true
    currentUser.value = {
      username: matched.username,
      displayName: matched.displayName,
      role: matched.role,
    }
    currentRole.value = matched.role

    if (matched.role === 'user') {
      activeStatus.value = 'all'
    }

    return { ok: true, role: matched.role, displayName: matched.displayName }
  }

  function logout() {
    isAuthenticated.value = false
    currentUser.value = null
    currentRole.value = 'user'
    activeStatus.value = 'all'
    searchKeyword.value = ''
    activeCategory.value = 'all'
    activeAdapt.value = 'all'
    sortBy.value = 'default'
  }

  async function seedDefaultNovels() {
    const endpoint = resolveResourcePath('/novels')
    const seeded = []
    for (const item of defaultNovels) {
      const payload = normalizeNovel(item)
      const { data: created } = await api.post(endpoint, payload)
      seeded.push(normalizeNovel(created))
    }
    novels.value = seeded.reverse()
  }

  async function loadInitialNovels() {
    isLoading.value = true
    const endpoint = resolveResourcePath('/novels')
    try {
      const { data } = await api.get(endpoint)

      if (Array.isArray(data) && data.length === 0) {
        await seedDefaultNovels()
        return
      }

      novels.value = data.map(normalizeNovel).reverse()
    } catch (err) {
      console.error('เชื่อมต่อ API ไม่สำเร็จ:', err)
      novels.value = defaultNovels.map(normalizeNovel)
    } finally {
      isLoading.value = false
    }
  }

  async function createNovel(payload) {
    if (!isAdmin.value) return
    const endpoint = resolveResourcePath('/novels')
    const newItem = normalizeNovel({
      id: String(Date.now()),
      category: payload.category,
      title: String(payload.title || '').trim(),
      author: String(payload.author || '').trim(),
      cover: String(payload.cover || '').trim(),
      youtubeId: String(payload.youtubeId || '').trim(),
      readUrl: String(payload.readUrl || '').trim(),
      Audiobooks: String(payload.Audiobooks || '').trim(),
      views: String(payload.views || '0').trim(),
      isEnd: Boolean(payload.isEnd),
      rating: String(payload.rating ?? '4.5').trim(),
      year: String(payload.year ?? '2026').trim(),
      ageRate: String(payload.ageRate ?? 'ทั่วไป').trim(),
      hasSeries: Boolean(payload.hasSeries),
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      synopsis: String(payload.synopsis || '').trim(),
      status: payload.status || 'published',
    })

    try {
      const { data: saved } = await api.post(endpoint, newItem)
      novels.value.unshift(normalizeNovel(saved))
    } catch (err) {
      console.error('เพิ่มนิยายไม่สำเร็จ:', err)
    }
  }

  async function updateNovel(novelId, updatedFields) {
    if (!isAdmin.value) return
    const idStr = String(novelId)
    const idx = novels.value.findIndex((n) => String(n.id) === idStr)
    if (idx === -1) return

    const target = novels.value[idx]
    const endpoint = resolveResourcePath('/novels')

    const patchData = {
      category: normalizeCategory(updatedFields.category ?? target.category),
      title: String(updatedFields.title ?? target.title ?? '').trim(),
      author: String(updatedFields.author ?? target.author ?? '').trim(),
      cover: String(updatedFields.cover ?? target.cover ?? '').trim(),
      youtubeId: String(updatedFields.youtubeId ?? target.youtubeId ?? '').trim(),
      readUrl: String(updatedFields.readUrl ?? target.readUrl ?? '').trim(),
      Audiobooks: String(updatedFields.Audiobooks ?? target.Audiobooks ?? '').trim(),
      views: String(updatedFields.views ?? target.views ?? '0').trim(),
      isEnd: Boolean(updatedFields.isEnd),
      rating: String(updatedFields.rating ?? target.rating ?? '4.5').trim(),
      year: String(updatedFields.year ?? target.year ?? '2026').trim(),
      ageRate: String(updatedFields.ageRate ?? target.ageRate ?? 'ทั่วไป').trim(),
      hasSeries: Boolean(updatedFields.hasSeries),
      tags: Array.isArray(updatedFields.tags) ? updatedFields.tags : [],
      synopsis: String(updatedFields.synopsis ?? target.synopsis ?? '').trim(),
      status: updatedFields.status === 'draft' ? 'draft' : 'published',
    }

    const updatedNovel = {
      ...target,
      ...patchData,
      id: idStr,
    }
    novels.value[idx] = updatedNovel

    try {
      await api.put(`${endpoint}/${idStr}`, updatedNovel)
    } catch (err) {
      console.error('แก้ไขข้อมูลนิยายไม่สำเร็จ:', err)
    }
  }

  async function toggleStatus(novelId) {
    if (!isAdmin.value) return
    const item = novels.value.find((n) => String(n.id) === String(novelId))
    if (!item) return

    const endpoint = resolveResourcePath('/novels')
    const nextStatus = item.status === 'published' ? 'draft' : 'published'
    try {
      await api.patch(`${endpoint}/${item.id}`, { status: nextStatus })
      item.status = nextStatus
    } catch (err) {
      console.error('อัปเดตสถานะไม่สำเร็จ:', err)
    }
  }

  async function removeNovel(novelId) {
    if (!isAdmin.value) return
    const idStr = String(novelId)
    const endpoint = resolveResourcePath('/novels')
    try {
      await api.delete(`${endpoint}/${idStr}`)
      novels.value = novels.value.filter((n) => String(n.id) !== idStr)
    } catch (err) {
      console.error('ลบนิยายไม่สำเร็จ:', err)
    }
  }

  async function resetAllData() {
    if (!isAdmin.value) return
    isLoading.value = true
    const endpoint = resolveResourcePath('/novels')
    try {
      for (const item of novels.value) {
        await api.delete(`${endpoint}/${item.id}`)
      }
      await seedDefaultNovels()
      searchKeyword.value = ''
      activeCategory.value = 'all'
      activeAdapt.value = 'all'
      activeStatus.value = 'all'
      sortBy.value = 'default'
    } catch (err) {
      console.error('รีเซ็ตข้อมูลไม่สำเร็จ:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    isAuthenticated,
    currentUser,
    currentRole,
    siteName,
    novels,
    searchKeyword,
    activeCategory,
    activeAdapt,
    activeStatus,
    sortBy,
    sortOptions,
    isLoading,
    isAdmin,
    categoryFilterList,
    adaptFilterList,
    getCategoryLabel,
    filteredNovels,
    totalNovelsCount,
    displayedNovelsCount,
    login,
    logout,
    loadInitialNovels,
    createNovel,
    updateNovel,
    toggleStatus,
    removeNovel,
    resetAllData,
  }
})
