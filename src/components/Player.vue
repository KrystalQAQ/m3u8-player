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
  title: {
    type: String,
    default: '',
  },
  isPreview: {
    type: Boolean,
    default: false,
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
      pip: true,
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

    let lastLogTime = 0;
    dp.on('play', () => {
      logPlayerData('play');
    });

    dp.on('timeupdate', () => {
      if (dp && dp.video.currentTime > 0) {
        emit('timeupdate', dp.video.currentTime);
        const now = Date.now();
        if (now - lastLogTime > 60000) { // Log every 60 seconds
          // logPlayerData('timeupdate');
          lastLogTime = now;
        }
      }
    });

    dp.on('seeking', () => {
      logPlayerData('seeking');
    });

    const logPlayerData = (event) => {
      if (props.isPreview) {
        return;
      }
      fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: event,
          src: props.src,
          title: props.title,
          currentTime: dp.video.currentTime,
          userAgent: navigator.userAgent,
        }),
      });
    };
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