<script setup lang="ts">
const { t } = useI18n()
const toast = useToast()
const modalOpen = ref(false)
const tab = ref('a')
const select = ref('1')
const input = ref('')
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold text-slate-900">{{ t('dev.title') }}</h1>
    <p class="text-slate-500 mt-1 mb-8">{{ t('dev.subtitle') }}</p>

    <section class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      <h2 class="font-semibold text-slate-900 mb-4">Buttons</h2>
      <div class="flex flex-wrap gap-3">
        <BaseButton>Primary</BaseButton>
        <BaseButton variant="secondary">Secondary</BaseButton>
        <BaseButton variant="ghost">Ghost</BaseButton>
        <BaseButton variant="danger">Danger</BaseButton>
        <BaseButton loading>Loading</BaseButton>
        <BaseButton disabled>Disabled</BaseButton>
      </div>
    </section>

    <section class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      <h2 class="font-semibold text-slate-900 mb-4">Form</h2>
      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="input" label="Input" placeholder="Type something…" />
        <BaseInput v-model="input" label="With error" error="This field is required" />
        <BaseTextarea label="Textarea" :rows="3" />
        <BaseSelect
          v-model="select"
          label="Select"
          :options="[
            { value: '1', label: 'Option A' },
            { value: '2', label: 'Option B' },
          ]"
        />
      </div>
    </section>

    <section class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      <h2 class="font-semibold text-slate-900 mb-4">Tabs / Dropdown / Modal</h2>
      <BaseTabs
        v-model="tab"
        :tabs="[
          { key: 'a', label: 'Tab A' },
          { key: 'b', label: 'Tab B' },
        ]"
        class="mb-4"
      />
      <div class="flex items-center gap-3">
        <BaseDropdown>
          <template #trigger>
            <BaseButton variant="secondary">Dropdown</BaseButton>
          </template>
          <button class="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md">Item 1</button>
          <button class="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md">Item 2</button>
        </BaseDropdown>
        <BaseButton variant="secondary" @click="modalOpen = true">Open Modal</BaseButton>
        <BaseButton variant="secondary" @click="toast.success('Hello DevFlow!')">Toast</BaseButton>
      </div>
      <BaseModal v-model="modalOpen" title="Modal Title">
        <p class="text-sm text-slate-600">This is a hand-crafted modal built with Tailwind CSS.</p>
        <div class="flex justify-end gap-2 mt-5">
          <BaseButton variant="secondary" @click="modalOpen = false">{{ t('common.cancel') }}</BaseButton>
          <BaseButton @click="modalOpen = false">{{ t('common.confirm') }}</BaseButton>
        </div>
      </BaseModal>
    </section>

    <section class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      <h2 class="font-semibold text-slate-900 mb-4">Feedback & Display</h2>
      <div class="flex items-center gap-3 mb-4">
        <BaseSkeleton class="w-24 h-4" />
        <BaseSkeleton class="w-16 h-4" />
        <BaseSpinner size="sm" />
        <BaseSpinner />
      </div>
      <div class="flex items-center gap-4">
        <BaseAvatar name="Alice" size="sm" />
        <BaseAvatar name="Bob" size="md" />
        <BaseAvatar name="Carol" size="lg" />
        <BaseTag name="Vue" slug="vue" />
        <BaseTag name="Node.js" slug="nodejs" />
      </div>
      <BaseEmpty :text="t('home.empty')" class="mt-2" />
    </section>
  </div>
</template>
