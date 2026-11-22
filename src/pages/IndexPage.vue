<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="q-gutter-md" style="max-width: 1200px; margin: 0 auto">
      <q-card flat bordered class="q-pa-md">
        <div class="row items-center justify-between q-gutter-md">
          <div>
            <div class="row items-center q-gutter-sm">
              <div class="text-h5 text-weight-bold text-primary">
                {{ store.siteName }}
              </div>
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-badge :color="store.isAdmin ? 'deep-purple' : 'teal'"
              :label="store.isAdmin ? 'แอดมิน (Admin)' : 'ผู้ใช้ทั่วไป (User)'" />
            <q-btn v-if="store.isAdmin" flat dense color="grey-8" icon="restart_alt" label="รีเซ็ตคลัง"
              @click="handleResetData" />

            <q-btn outline dense color="negative" icon="logout" label="ออกจากระบบ" @click="handleLogout" />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md q-mb-md items-center">
          <div class="col-xs-12 col-sm-6 col-md-4">
            <q-input v-model="store.searchKeyword" outlined dense clearable label="ค้นหาชื่อเรื่อง เรื่องย่อ หรือแท็ก">
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-xs-12 col-sm-6 col-md-3">
            <q-select v-model="store.sortBy" :options="store.sortOptions" option-label="label" option-value="value"
              emit-value map-options outlined dense label="เรียงลำดับตาม">
              <template #prepend>
                <q-icon name="sort" />
              </template>
            </q-select>
          </div>
        </div>

        <div class="col-xs-12 col-md-5">
          <div class="row q-gutter-xs">
            <q-btn v-for="cat in store.categoryFilterList" :key="cat.value" size="sm" unelevated
              :color="store.activeCategory === cat.value ? 'primary' : 'grey-3'"
              :text-color="store.activeCategory === cat.value ? 'white' : 'dark'" :label="cat.label"
              @click="store.activeCategory = cat.value" />
          </div>
        </div>

        <div class="row items-center justify-between q-mt-sm q-gutter-xs">
          <div class="row items-center q-gutter-xs">
            <span class="text-caption text-grey-7">การดัดแปลง:</span>
            <q-btn v-for="ad in store.adaptFilterList" :key="ad.value" size="sm" unelevated
              :color="store.activeAdapt === ad.value ? 'secondary' : 'grey-3'"
              :text-color="store.activeAdapt === ad.value ? 'white' : 'dark'" :label="ad.label"
              @click="store.activeAdapt = ad.value" />
          </div>

          <div v-if="store.isAdmin" class="row items-center q-gutter-xs">
            <span class="text-caption text-grey-7">สถานะ (Admin):</span>
            <q-btn size="sm" unelevated :color="store.activeStatus === 'all' ? 'deep-purple' : 'grey-3'"
              :text-color="store.activeStatus === 'all' ? 'white' : 'dark'" label="ทั้งหมด"
              @click="store.activeStatus = 'all'" />
            <q-btn size="sm" unelevated :color="store.activeStatus === 'published' ? 'positive' : 'grey-3'"
              :text-color="store.activeStatus === 'published' ? 'white' : 'dark'" label="เผยแพร่แล้ว"
              @click="store.activeStatus = 'published'" />
            <q-btn size="sm" unelevated :color="store.activeStatus === 'draft' ? 'warning' : 'grey-3'"
              :text-color="store.activeStatus === 'draft' ? 'white' : 'dark'" label="ฉบับร่าง"
              @click="store.activeStatus = 'draft'" />
          </div>
        </div>
      </q-card>

      <AddNovelCard v-if="store.isAdmin" @submit-novel="handleCreateNovel" />

      <div v-if="store.isLoading" class="row justify-center q-pa-lg">
        <q-spinner-dots color="primary" size="42px" />
      </div>

      <div v-else-if="store.filteredNovels.length > 0" class="row q-mt-md">
        <div v-for="novel in store.filteredNovels" :key="novel.id" class="col-6 col-sm-4 col-md-3 q-pa-xs">
          <q-card flat bordered class="column justify-between full-height bg-white">
            <div>
              <div style="padding: 12px 12px 4px 12px">
                <q-img v-if="novel.cover" :src="novel.cover" :ratio="2 / 3" fit="cover"
                  class="rounded-borders overflow-hidden bg-grey-2" style="width: 100%; display: block"
                  :img-style="{ objectPosition: 'center top' }">
                  <template #error>
                    <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                      ไม่มีรูปปก
                    </div>
                  </template>
                </q-img>
                <div v-else style="aspect-ratio: 2 / 3; width: 100%"
                  class="flex flex-center bg-grey-3 text-grey-7 rounded-borders">
                  ไม่มีรูปปก
                </div>
              </div>

              <q-card-section>
                <div class="row items-center justify-between q-gutter-xs q-mb-xs">
                  <q-badge color="primary" :label="store.getCategoryLabel(novel.category)" />
                  <div class="text-caption text-grey-7">
                    ★ {{ novel.rating }} • {{ novel.views }} • {{ novel.isEnd ? 'จบแล้ว' : 'ยังไม่จบ' }}
                  </div>
                </div>

                <div class="text-subtitle1 text-weight-bold q-mt-xs">
                  {{ novel.title }}
                </div>

                <div class="text-caption text-grey-7 q-mb-xs">
                  ปี {{ novel.year }} • เรต {{ novel.ageRate }}
                  <span v-if="novel.hasSeries"> • มีซีรีส์</span>
                </div>

                <div class="text-body2 text-grey-8 q-mt-xs" style="line-height: 1.5">
                  {{ novel.synopsis }}
                </div>

                <div v-if="novel.tags?.length" class="row q-gutter-xs q-mt-sm">
                  <q-chip v-for="tag in novel.tags.slice(0, 3)" :key="tag" dense size="sm" color="grey-2"
                    text-color="grey-9">
                    {{ tag }}
                  </q-chip>
                </div>
              </q-card-section>
            </div>

            <q-card-actions class="justify-between items-center q-px-md q-pb-md">
              <q-btn flat dense color="primary" label="ดูรายละเอียด" @click="openDetail(novel)" />

              <div v-if="store.isAdmin" class="row items-center q-gutter-xs">
                <q-badge :color="novel.status === 'published' ? 'positive' : 'warning'"
                  :label="novel.status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'" class="cursor-pointer"
                  @click="handleToggleStatus(novel)" />
                <q-btn flat round dense size="sm" color="primary" icon="edit" @click="openEditDialog(novel)">
                  <q-tooltip>แก้ไขนิยาย</q-tooltip>
                </q-btn>
                <q-btn flat round dense size="sm" color="negative" icon="delete_outline"
                  @click="openDeleteConfirm(novel)">
                  <q-tooltip>ลบนิยาย</q-tooltip>
                </q-btn>
              </div>
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <q-card v-else flat bordered class="q-pa-lg text-center text-grey-6">
        ไม่พบนิยายที่ตรงกับเงื่อนไขการค้นหา
      </q-card>
    </div>

    <q-dialog v-model="editDialog" persistent>
      <q-card class="rounded-borders" style="min-width: 340px; max-width: 660px; width: 100%">
        <q-card-section class="row items-center justify-between bg-primary text-white q-py-sm q-px-md">
          <div class="row items-center q-gutter-sm">
            <q-icon name="edit_note" size="24px" />
            <div class="text-subtitle1 text-weight-bold">แก้ไขข้อมูลนิยาย</div>
          </div>
          <q-btn icon="close" flat round dense color="white" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md q-gutter-md" style="max-height: 75vh; overflow-y: auto">
          <div class="text-caption text-weight-bold text-primary">ข้อมูลพื้นฐาน</div>
          <q-input v-model="editForm.title" outlined dense label="ชื่อเรื่อง *" />

          <div class="row q-col-gutter-sm">
            <div class="col-xs-12 col-sm-6">
              <q-select v-model="editForm.category" :options="categoryOptions" option-label="label" option-value="value"
                emit-value map-options outlined dense label="หมวดหมู่" />
            </div>
            <div class="col-xs-12 col-sm-6">
              <q-select v-model="editForm.status" :options="statusOptions" option-label="label" option-value="value"
                emit-value map-options outlined dense label="สถานะการแสดงผล" />
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-6 col-sm-3">
              <q-input v-model="editForm.rating" outlined dense label="คะแนน" />
            </div>
            <div class="col-6 col-sm-3">
              <q-input v-model="editForm.views" outlined dense label="ยอดอ่าน" />
            </div>
            <div class="col-6 col-sm-3">
              <q-input v-model="editForm.year" outlined dense label="ปี" />
            </div>
            <div class="col-6 col-sm-3">
              <q-input v-model="editForm.ageRate" outlined dense label="เรตอายุ" />
            </div>
          </div>

          <div class="row q-gutter-md bg-grey-1 q-pa-xs q-px-sm rounded-borders">
            <q-toggle v-model="editForm.isEnd" dense label="จบแล้ว" />
            <q-toggle v-model="editForm.hasSeries" dense label="มีซีรีส์" />
          </div>

          <q-separator />

          <div class="text-caption text-weight-bold text-primary">รูปปก ลิงก์ และวิดีโอตัวอย่าง</div>
          <q-input v-model="editForm.cover" outlined dense label="ลิงก์หรือพาธรูปปก (เช่น /images/...)" />
          <q-input v-model="editForm.readUrl" outlined dense label="ลิงก์อ่านนิยาย (readUrl)" />
          <q-input v-model="editForm.youtubeId" outlined dense clearable
            label="YouTube Video ID หรือลิงก์ YouTube (เช่น dQw4w9WgXcQ)" />

          <div v-if="previewYoutubeId" class="q-mt-xs">
            <div class="text-caption text-grey-7 q-mb-xs">ตัวอย่างวิดีโอ:</div>
            <div class="overflow-hidden rounded-borders bg-black"
              style="position: relative; width: 100%; padding-top: 56.25%">
              <iframe :src="`https://www.youtube.com/embed/${previewYoutubeId}`" title="ตัวอย่างวิดีโอนิยาย"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen style="position: absolute; inset: 0; width: 100%; height: 100%" />
            </div>
          </div>

          <q-separator />

          <div class="text-caption text-weight-bold text-primary">แท็กและเรื่องย่อ</div>
          <q-input v-model="editForm.tagsText" outlined dense
            label="แท็ก (คั่นด้วยเครื่องหมายจุลภาค , เช่น แฟนตาซี, ระบบ)" />
          <q-input v-model="editForm.synopsis" type="textarea" rows="4" outlined dense label="เรื่องย่อ *" />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="bg-grey-1 q-pa-md">
          <q-btn flat label="ยกเลิก" color="grey-7" v-close-popup />
          <q-btn unelevated icon="save" label="บันทึกการแก้ไข" color="primary"
            :disable="!editForm.title.trim() || !editForm.synopsis.trim()" @click="saveEditNovel" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="detailDialog">
      <q-card style="min-width: 320px; max-width: 640px; width: 100%">
        <q-card-section v-if="selectedNovel">
          <div class="text-h6 text-weight-bold">{{ selectedNovel.title }}</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            หมวด: {{ store.getCategoryLabel(selectedNovel.category) }} • คะแนน ★
            {{ selectedNovel.rating }} • ยอดอ่าน {{ selectedNovel.views }} • ปี
            {{ selectedNovel.year }} • เรต {{ selectedNovel.ageRate }}
          </div>

          <div class="text-body1 q-mt-md" style="white-space: pre-line">
            {{ selectedNovel.synopsis }}
          </div>

          <div v-if="selectedNovel.tags?.length" class="row q-gutter-xs q-mt-md">
            <q-chip v-for="tag in selectedNovel.tags" :key="tag" dense color="grey-2" text-color="grey-9">
              #{{ tag }}
            </q-chip>
          </div>

          <div v-if="detailYoutubeId" class="q-mt-md">
            <div class="overflow-hidden rounded-borders bg-black"
              style="position: relative; width: 100%; padding-top: 56.25%">
              <iframe :src="`https://www.youtube.com/embed/${detailYoutubeId}`" title="วิดีโอนิยาย" frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen style="position: absolute; inset: 0; width: 100%; height: 100%" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-gutter-xs">
          <q-btn flat label="ปิด" color="grey-7" v-close-popup />
          <q-btn v-if="isExternalUrl(selectedNovel?.readUrl)" unelevated color="primary" label="อ่านนิยาย" type="a"
            :href="selectedNovel.readUrl" target="_blank" rel="noopener noreferrer" />
          <q-btn v-if="isExternalUrl(selectedNovel?.Audiobooks)" unelevated color="secondary" label="หนังสือเสียง"
            type="a" :href="selectedNovel.Audiobooks" target="_blank" rel="noopener noreferrer" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteDialog" persistent>
      <q-card style="min-width: 300px">
        <q-card-section class="row items-center">
          <q-icon name="warning" color="warning" size="36px" class="q-mr-md" />
          <div>
            <div class="text-h6">ยืนยันการลบนิยาย</div>
            <div class="text-body2">
              ต้องการลบ "{{ novelToDelete?.title }}" ใช่หรือไม่
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="ยกเลิก" color="grey" v-close-popup />
          <q-btn unelevated label="ลบออก" color="negative" @click="confirmDeleteNovel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useNovelCatalogStore } from '@/stores/novelCatalogStore'
import { categoryOptions } from '@/data/novels'
import AddNovelCard from '@/pages/AddNovelCard.vue'

const router = useRouter()
const $q = useQuasar()
const store = useNovelCatalogStore()

const statusOptions = [
  { label: 'เผยแพร่แล้ว', value: 'published' },
  { label: 'ฉบับร่าง', value: 'draft' }
]

const detailDialog = ref(false)
const selectedNovel = ref(null)

const editDialog = ref(false)
const editingId = ref(null)
const editForm = reactive({
  title: '',
  category: categoryOptions[0]?.value || 'bl',
  status: 'published',
  rating: '4.5',
  views: '0',
  year: '2026',
  ageRate: 'ทั่วไป',
  isEnd: false,
  hasSeries: false,
  cover: '',
  readUrl: '',
  Audiobooks: '',
  youtubeId: '',
  tagsText: '',
  synopsis: ''
})

const deleteDialog = ref(false)
const novelToDelete = ref(null)

const extractYoutubeId = (value) => {
  if (!value) return ''
  const trimmed = String(value).trim()
  const match = trimmed.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (match) return match[1]
  return /^[A-Za-z0-9_-]{11}$/.test(trimmed) ? trimmed : ''
}

const previewYoutubeId = computed(() => extractYoutubeId(editForm.youtubeId))
const detailYoutubeId = computed(() => extractYoutubeId(selectedNovel.value?.youtubeId))

const notify = (type, message) => {
  $q.notify({ type, message })
}

onMounted(() => {
  store.loadInitialNovels()
})

const handleLogout = () => {
  store.logout()
  notify('info', 'ออกจากระบบแล้ว')
  router.replace('/login')
}

const handleCreateNovel = async (newNovel) => {
  await store.createNovel({
    ...newNovel,
    youtubeId: extractYoutubeId(newNovel.youtubeId)
  })
  notify('positive', `เพิ่ม "${newNovel.title}" แล้ว`)
}

const openEditDialog = (novel) => {
  editingId.value = novel.id
  Object.assign(editForm, {
    title: novel.title || '',
    category: novel.category || categoryOptions[0]?.value || 'bl',
    status: novel.status || 'published',
    rating: String(novel.rating ?? '4.5'),
    views: String(novel.views ?? '0'),
    year: String(novel.year ?? '2026'),
    ageRate: String(novel.ageRate ?? 'ทั่วไป'),
    isEnd: Boolean(novel.isEnd),
    hasSeries: Boolean(novel.hasSeries),
    cover: novel.cover || '',
    readUrl: novel.readUrl || '',
    Audiobooks: novel.Audiobooks || '',
    youtubeId: novel.youtubeId || '',
    tagsText: Array.isArray(novel.tags) ? novel.tags.join(', ') : '',
    synopsis: novel.synopsis || ''
  })
  editDialog.value = true
}

const saveEditNovel = async () => {
  if (!editingId.value || !editForm.title.trim() || !editForm.synopsis.trim()) return

  const tags = editForm.tagsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  await store.updateNovel(editingId.value, {
    ...editForm,
    youtubeId: previewYoutubeId.value,
    tags
  })
  editDialog.value = false
  notify('positive', `บันทึกการแก้ไข "${editForm.title.trim()}" แล้ว`)
}

const handleToggleStatus = async (novel) => {
  await store.toggleStatus(novel.id)
  notify('info', `เปลี่ยนสถานะของ "${novel.title}" แล้ว`)
}

const openDetail = (novel) => {
  selectedNovel.value = novel
  detailDialog.value = true
}

const openDeleteConfirm = (novel) => {
  novelToDelete.value = novel
  deleteDialog.value = true
}

const confirmDeleteNovel = async () => {
  if (!novelToDelete.value) return
  const title = novelToDelete.value.title
  await store.removeNovel(novelToDelete.value.id)
  deleteDialog.value = false
  novelToDelete.value = null
  notify('negative', `ลบ "${title}" แล้ว`)
}

const handleResetData = async () => {
  await store.resetAllData()
  notify('info', 'รีเซ็ตข้อมูลคลังนิยายเรียบร้อยแล้ว')
}

const isExternalUrl = (url) => typeof url === 'string' && /^https?:\/\//i.test(url.trim())
</script>