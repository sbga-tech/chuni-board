<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useVModel } from '@vueuse/core'

const props = defineProps<{
  defaultValue?: string
  modelValue?: string
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string): void
  (e: 'focus', payload: FocusEvent): void
  (e: 'blur', payload: FocusEvent): void
  (e: 'keydown', payload: KeyboardEvent): void
  (e: 'keyup', payload: KeyboardEvent): void
  (e: 'keypress', payload: KeyboardEvent): void
}>()

const emitFocus = (e: FocusEvent) => emits('focus', e)
const emitBlur = (e: FocusEvent) => emits('blur', e)
const emitKeydown = (e: KeyboardEvent) => emits('keydown', e)
const emitKeyup = (e: KeyboardEvent) => emits('keyup', e)
const emitKeypress = (e: KeyboardEvent) => emits('keypress', e)


const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const inputField = ref<HTMLInputElement | null>(null);

defineExpose({ inputField });
</script>

<template>
  <input ref="inputField" @focus="emitFocus" @blur="emitBlur" @keydown="emitKeydown" @keyup="emitKeyup" @keypress="emitKeypress" v-model="modelValue" :class="cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', props.class)">
</template>
