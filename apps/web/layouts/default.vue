<template>
  <div class="min-h-screen flex flex-col">
    我是生产环境
    <AppHeader />
    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <slot />
    </main>
    <AppFooter />
    <BaseToast />
  </div>
</template>