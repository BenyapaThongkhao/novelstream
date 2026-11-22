<template>
  <q-card flat bordered class="q-pa-md bg-white">
    <div class="text-h6 text-primary q-mb-md">
      เพิ่มนิยายแนะนำใหม่
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-xs-12 col-sm-4">
        <q-input v-model="form.title" outlined dense label="ชื่อเรื่องนิยาย *" />
      </div>

      <div class="col-xs-12 col-sm-4">
        <q-input v-model="form.author" outlined dense label="ผู้เขียน / นามปากกา" />
      </div>

      <div class="col-xs-12 col-sm-4">
        <q-select v-model="form.category" :options="categoryOptions" option-label="label" option-value="value"
          emit-value map-options outlined dense label="หมวดหมู่" />
      </div>

      <div class="col-xs-12 col-sm-3">
        <q-input v-model="form.rating" outlined dense label="คะแนนแนะนำ (1.0 - 5.0)" />
      </div>

      <div class="col-xs-12 col-sm-3">
        <q-select v-model="form.status" :options="statusOptions" option-label="label" option-value="value" emit-value
          map-options outlined dense label="สถานะ" />
      </div>

      <div class="col-xs-12 col-sm-6">
        <q-input v-model="form.readUrl" outlined dense label="ลิงก์อ่าน / อีบุ๊ก" />
      </div>

      <div class="col-xs-12">
        <q-input v-model="form.cover" outlined dense label="พาธรูปปก (เช่น /images/cover01.jpg)" />
      </div>

      <div class="col-xs-12">
        <q-input v-model="form.synopsis" type="textarea" rows="2" outlined dense label="เรื่องย่อแนะนำ *" />
      </div>
    </div>

    <div class="row justify-end q-mt-md">
      <q-btn unelevated color="primary" icon="add" label="เพิ่มลงคลังนิยาย"
        :disable="!form.title.trim() || !form.synopsis.trim()" @click="submitForm" />
    </div>
  </q-card>
</template>

<script setup>
import { reactive } from 'vue'
import { categoryOptions } from '@/data/novels'

const emit = defineEmits(['submit-novel'])

const statusOptions = [
  { label: 'เผยแพร่แล้ว', value: 'published' },
  { label: 'ฉบับร่าง', value: 'draft' }
]

const defaultForm = () => ({
  title: '',
  author: '',
  category: categoryOptions[0]?.value || 'bl',
  rating: '4.8',
  status: 'published',
  readUrl: 'https://www.mebmarket.com',
  cover: '',
  synopsis: ''
})

const form = reactive(defaultForm())

const submitForm = () => {
  if (!form.title.trim() || !form.synopsis.trim()) return

  emit('submit-novel', { ...form })
  Object.assign(form, defaultForm())
}
</script>