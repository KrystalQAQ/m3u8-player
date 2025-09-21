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
  startTime: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['timeupdate']);

const playerContainer = ref(null);
let dp = null;

onMounted(() => {
  if (playerContainer.value) {
    dp = new DPlayer({
      container: playerContainer.value,
      autoplay: true,
      video: {
        url: props.src,
        type: 'customHls',
        customType: {
          customHls: function (video, player) {
            const hls = new Hls();
            hls.loadSource(video.src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
              if (props.startTime > 0) {
                player.seek(props.startTime);
              }
              player.play();
            });
          },
        },
      },
    });

    dp.on('timeupdate', () => {
      if (dp && dp.video.currentTime > 0) {
        emit('timeupdate', dp.video.currentTime);
      }
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