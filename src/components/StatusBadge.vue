<script setup lang="ts">
import { computed } from 'vue';
import { STATUS_META } from '../domain/calculation';
import type { CheckStatus } from '../domain/types';

const props = withDefaults(defineProps<{
  status: CheckStatus;
  compact?: boolean;
}>(), {
  compact: false,
});

const meta = computed(() => STATUS_META[props.status]);
</script>

<template>
  <div
    class="status-badge"
    :class="[`status-${status}`, { compact }]"
    :style="{ '--status-color': meta.color }"
    role="status"
    aria-live="polite"
  >
    <span class="status-icon" aria-hidden="true">{{ meta.icon }}</span>
    <span class="status-copy">
      <strong>{{ meta.label }}</strong>
      <span v-if="!compact">{{ meta.conclusion }}</span>
    </span>
  </div>
</template>
