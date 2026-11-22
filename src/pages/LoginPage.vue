<template>
  <q-page class="flex flex-center bg-grey-2 q-pa-md">
    <q-card flat bordered class="q-pa-lg bg-white" style="width: 100%; max-width: 420px">
      <div class="text-center q-mb-md">
        <q-icon name="auto_stories" size="48px" color="primary" />
        <div class="text-h4 text-weight-bold text-primary q-mt-xs">
          NOVELSTREAM
        </div>
        <div class="text-caption text-grey-7 q-mt-md">
          กรุณากรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าใช้งานระบบ
        </div>
      </div>

      <q-form ref="loginFormRef" class="q-gutter-md" @submit.prevent="handleLogin">
        <q-input
          v-model="username"
          label="ชื่อผู้ใช้ (Username)"
          outlined
          dense
          autocomplete="username"
          :rules="[(v) => (v && v.trim().length > 0) || 'กรุณากรอกชื่อผู้ใช้']"
        >
          <template #prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="รหัสผ่าน (Password)"
          outlined
          dense
          autocomplete="current-password"
          :rules="[(v) => (v && v.trim().length > 0) || 'กรุณากรอกรหัสผ่าน']"
        >
          <template #prepend>
            <q-icon name="lock" />
          </template>
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <div class="flex flex-center">
          <q-btn type="submit" color="primary" class="full-width" size="md" label="เข้าสู่ระบบ" />
        </div>
      </q-form>

      <q-separator class="q-my-md" />

      <div class="text-caption text-grey-7 q-mb-xs">บัญชีสำหรับทดสอบระบบ:</div>
      <div class="row q-col-gutter-sm text-caption text-grey-6">
        <div class="col-6">
          <div>ชื่อ user</div>
          <div>รหัส 123456</div>
        </div>
        <div class="col-6">
          <div>ชื่อ admin</div>
          <div>รหัส 123456</div>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useNovelCatalogStore } from '@/stores/novelCatalogStore'

const router = useRouter()
const $q = useQuasar()
const store = useNovelCatalogStore()

const loginFormRef = ref(null)
const username = ref('')
const password = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  const valid = await loginFormRef.value?.validate()
  if (!valid) return

  const res = store.login(username.value, password.value)
  if (!res.ok) {
    $q.notify({ type: 'negative', message: res.message })
    return
  }

  $q.notify({ type: 'positive', message: `ยินดีต้อนรับ ${res.displayName}` })
  router.replace('/')
}
</script>