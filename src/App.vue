<script setup>
import { ref, computed, onMounted } from 'vue';
import Player from './components/Player.vue';
import { Parser } from 'm3u8-parser';
import { ElMessage } from 'element-plus';
import { savePlaylist, loadPlaylist, clearPlaylist } from './db';

const m3u8Url = ref('');
const videoSrc = ref('');
const fullPlaylist = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(15);
const currentPlaying = ref(null); // To track the currently playing item
const csvFileInput = ref(null);
const m3u8FileInput = ref(null);
const startTime = ref(0);

function openCsvFilePicker() {
  csvFileInput.value.click();
}

function openM3u8FilePicker() {
  m3u8FileInput.value.click();
}

function handleM3u8File(event) {
  const file = event.target.files[0];
  if (file) {
    handleFile(file);
  }
  event.target.value = '';
}

async function handleCsvFile(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target.result;
    const lines = content.split(/\r?\n/);
    const items = lines
      .map((line, index) => {
        const parts = line.split(',');
        if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
          return {
            id: index,
            title: parts[0].trim(),
            uri: parts[1].trim(),
          };
        }
        return null;
      })
      .filter(item => item !== null);

    if (items.length > 0) {
      fullPlaylist.value = items;
      await clearPlaylist();
      await savePlaylist(items);
      videoSrc.value = '';
      currentPlaying.value = null;
      currentPage.value = 1;
      ElMessage.success(`成功加载 ${items.length} 个视频`);
    } else {
      ElMessage.error('文件格式不正确或内容为空');
    }
  };
  reader.readAsText(file);
  // Reset file input
  event.target.value = '';
}

const filteredPlaylist = computed(() => {
  if (!searchQuery.value) {
    return fullPlaylist.value;
  }
  return fullPlaylist.value.filter(item =>
    item.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const paginatedPlaylist = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredPlaylist.value.slice(start, end);
});

onMounted(async () => {
  const savedPlaylist = await loadPlaylist();
  if (savedPlaylist) {
    fullPlaylist.value = savedPlaylist;
  }

  const savedPlayerState = localStorage.getItem('playerState');
  if (savedPlayerState) {
    const { src, time, item } = JSON.parse(savedPlayerState);
    if (src && time) {
      videoSrc.value = src;
      startTime.value = time;
      if (item) {
        currentPlaying.value = item;
      } else {
        // Try to find the item in the playlist
        const foundItem = fullPlaylist.value.find(pItem => pItem.uri === src);
        if (foundItem) {
          currentPlaying.value = foundItem;
        }
      }
    }
  }
});

async function playVideo() {
  fullPlaylist.value = [];
  await clearPlaylist();
  currentPlaying.value = null;
  videoSrc.value = m3u8Url.value;
}

function playFromPlaylist(item) {
  videoSrc.value = item.uri;
  currentPlaying.value = item;
  startTime.value = 0; // Reset start time when playing a new item
}

function handleTimeUpdate(time) {
  if (videoSrc.value) {
    const state = {
      src: videoSrc.value,
      time: time,
      item: currentPlaying.value
    };
    localStorage.setItem('playerState', JSON.stringify(state));
  }
}

async function handleFile(file) {
  if (file && (file.name.endsWith('.m3u8') || file.type === 'application/vnd.apple.mpegurl' || file.name.endsWith('.m3u'))) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const parser = new Parser();
      parser.push(content);
      parser.end();

      let items = [];
      if (parser.manifest.segments && parser.manifest.segments.length > 0) {
        items = parser.manifest.segments.map((item, index) => ({
          id: index,
          uri: item.uri,
          title: (item.title || `Segment ${index + 1}`).replace(/-1 group-title=\"\",/, '').trim()
        }));
      } else if (parser.manifest.playlists && parser.manifest.playlists.length > 0) {
        items = parser.manifest.playlists.map((item, index) => ({
          id: index,
          uri: item.uri,
          title: (item.attributes.NAME || `Stream ${index + 1}`).replace(/-1 group-title=\"\",/, '').trim()
        }));
      }

      if (items.length > 0) {
        fullPlaylist.value = items;
        await clearPlaylist();
        await savePlaylist(items);
        videoSrc.value = '';
        currentPlaying.value = null;
        currentPage.value = 1;
      } else {
        const url = URL.createObjectURL(file);
        m3u8Url.value = url;
        await playVideo();
      }
    };
    reader.readAsText(file);
  } else {
    ElMessage.error('请上传一个有效的 .m3u8 或 .m3u 文件');
  }
}

function beforeUpload(file) {
  handleFile(file);
  return false;
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>M3U8 Player</h1>
      <div class="input-area">
        <el-input v-model="m3u8Url" placeholder="输入 M3U8 地址或拖拽文件到下方区域"></el-input>
        <el-button type="primary" @click="playVideo">播放</el-button>
        <el-button type="info" @click="openM3u8FilePicker">M3U8模式</el-button>
        <el-button type="success" @click="openCsvFilePicker">逗号分隔模式</el-button>
        <input type="file" ref="csvFileInput" @change="handleCsvFile" style="display: none" accept=".txt,.csv" />
        <input type="file" ref="m3u8FileInput" @change="handleM3u8File" style="display: none" accept=".m3u8,.m3u" />
      </div>
    </header>

    <main class="content-area" :class="{ 'has-playlist': fullPlaylist.length > 0 }">
      <div class="player-wrapper">
        <div v-if="currentPlaying" class="now-playing">
          正在播放: {{ currentPlaying.title }}
        </div>
        <div class="player-container">
          <Player v-if="videoSrc" :src="videoSrc" :start-time="startTime" @timeupdate="handleTimeUpdate" />
          <div v-else class="player-placeholder">
            <span class="placeholder-icon">📺</span>
            <p>请播放一个视频或上传一个播放列表</p>
          </div>
        </div>
      </div>

      <div v-if="fullPlaylist.length > 0" class="playlist-wrapper">
        <el-input v-model="searchQuery" placeholder="搜索..." clearable class="search-input"></el-input>
        <ul class="playlist">
          <li v-for="item in paginatedPlaylist" :key="item.id" @click="playFromPlaylist(item)" :class="{ playing: currentPlaying && currentPlaying.id === item.id }">
            {{ item.title }}
          </li>
        </ul>
        <div class="pagination-container">
          <el-pagination
            small
            background
            layout="prev, pager, next"
            :total="filteredPlaylist.length"
            :page-size="pageSize"
            v-model:current-page="currentPage"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.app-header {
  padding: 1rem;
  background-color: var(--bg-color-soft);
  border-bottom: 1px solid var(--border-color);
}

.app-header h1 {
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  text-align: center;
}

.input-area {
  display: flex;
  gap: 1rem;
  max-width: 700px;
  margin: 0 auto;
}

.content-area {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
  flex-grow: 1;
  overflow: hidden;
}

.player-wrapper {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.now-playing {
  padding: 0.5rem 1rem;
  background-color: var(--bg-color-soft);
  border-radius: 6px 6px 0 0;
  border: 1px solid var(--border-color);
  border-bottom: none;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-container {
  width: 100%;
  height: 100%;
  min-height: 250px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background-color: #000;
  flex-grow: 1;
}

.player-container > :deep(div) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.upload-dragger {
  width: 100%;
  height: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-color);
  background-color: var(--bg-color-soft);
  transition: border-color 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
}

.player-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  background-color: var(--bg-color-soft);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.playlist-wrapper {
  background-color: var(--bg-color-soft);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-input {
  margin-bottom: 1rem;
}

.playlist {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex-grow: 1;
}

.playlist li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist li:hover {
  background-color: var(--bg-color-mute);
}

.playlist li.playing {
  background-color: #409eff;
  color: white;
}

.pagination-container {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

/* Desktop Layout */
@media (min-width: 992px) {
  .content-area.has-playlist {
    grid-template-columns: 3fr 1fr;
    grid-template-rows: 1fr;
  }
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .app-header {
    padding: 0.5rem;
  }
  .app-header h1 {
    margin-bottom: 0.5rem;
  }
  .content-area {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  .input-area {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>
