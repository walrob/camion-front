<template>
  <div
    class="category-btn flex flex-column text-center"
    :class="{ active, disabled }"
  >
    <div class="category-avatar-wrapper mb-2">
      <v-icon v-if="item.icon" class="category-icon">
        {{ item.icon }}
      </v-icon>
      <v-avatar v-if="item.url" :size="52" class="category-avatar">
        <v-img :src="returnUrlImg(item.url)" :alt="item.name" />
      </v-avatar>
    </div>

    <div class="text-button category-text">
      {{ item.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  item: {
    name: string;
    icon?: string;
    url?: string;
  };
  active?: boolean;
  disabled?: boolean;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.category-btn {
  min-width: 100px;
  max-width: 130px;
  padding: 16px 12px;
  border-radius: 16px;
  cursor: pointer;
  text-transform: capitalize;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  border: 1.5px solid rgba(0, 0, 0, 0.08);
  background-color: #fff;

  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);

  @media (min-width: 600px) {
    min-width: 120px;
    max-width: 150px;
    padding: 20px 16px;
  }

  .category-avatar-wrapper {
    transition: transform 0.25s ease;
  }

  .category-avatar {
    border: 2px solid transparent;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }

  .category-icon {
    font-size: 28px;
    color: rgb(var(--v-theme-textSecondary));
    transition: all 0.25s ease;
  }

  .category-text {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgb(var(--v-theme-textSecondary));
    transition: all 0.25s ease;
    line-height: 1.3;
    letter-spacing: 0;
    text-transform: none;
    white-space: normal;
    word-break: break-word;
    max-width: 100%;

    @media (min-width: 600px) {
      font-size: 0.78rem;
    }
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(93, 135, 255, 0.16);
    border-color: rgba(var(--v-theme-primary), 0.3);

    .category-avatar-wrapper {
      transform: scale(1.05);
    }

    .category-icon {
      color: rgb(var(--v-theme-primary));
    }
  }

  &.disabled {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
  }

  &.active {
    border: 2px solid rgb(var(--v-theme-primary));
    background: linear-gradient(
      135deg,
      rgba(var(--v-theme-primary), 0.08),
      rgba(var(--v-theme-primary), 0.04)
    );
    box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.2);

    .category-avatar {
      border-color: rgb(var(--v-theme-primary));
      box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.15);
    }

    .category-icon {
      color: rgb(var(--v-theme-primary));
      font-size: 32px;
    }

    .category-text {
      color: rgb(var(--v-theme-primary));
      font-weight: 700;
    }
  }
}
</style>
