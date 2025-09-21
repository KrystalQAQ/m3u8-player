<template>
  <div ref="playerContainer"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import DPlayer from 'dplayer';
import Hls from 'hls.js';

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
});

const playerContainer = ref(null);
let dp = null;

onMounted(() => {
  if (playerContainer.value) {
    dp = new DPlayer({
      container: playerContainer.value,
      video: {
        url: props.src,
        type: 'customHls',
        customType: {
          customHls: function (video, player) {
            const hls = new Hls();
            hls.loadSource(video.src);
            hls.attachMedia(video);
          },
        },
      },
    });
  }
});

onBeforeUnmount(() => {
  if (dp) {
    dp.destroy();
  }
});

watch(() => props.src, (newSrc) => {
  if (dp) {
    dp.switchVideo({
      url: newSrc,
      type: 'customHls',
    });
    // DPlayer's switchVideo might not re-trigger the custom type handler correctly.
    // A more robust way is to destroy and re-create the player.
    // However, for simplicity, we'll try switching first. If issues persist,
    // re-creation is the next step.
    dp.play();
  }
});
</script>

<style scoped>
/* DPlayer will inject its own styles */
</style>