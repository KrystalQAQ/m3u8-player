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
      autoplay: true, // Add autoplay option
      video: {
        url: props.src,
        type: 'customHls',
        customType: {
          customHls: function (video, player) {
            const hls = new Hls();
            hls.loadSource(video.src);
            hls.attachMedia(video);
            // Ensure play is called after hls is attached
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
              player.play();
            });
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
    // After switching, we need to ensure it plays. A small delay can help.
    setTimeout(() => {
      dp.play();
    }, 100);
  }
});
</script>

<style scoped>
/* DPlayer will inject its own styles */
</style>