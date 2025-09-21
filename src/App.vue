<script setup>
import { ref, computed } from 'vue';
import Player from './components/Player.vue';
import { Parser } from 'm3u8-parser';
import { ElMessage } from 'element-plus';

const m3u8Url = ref('');
const videoSrc = ref('');
const fullPlaylist = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

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

function playVideo() {
  fullPlaylist.value = [];
  videoSrc.value = m3u8Url.value;
}

function playFromPlaylist(item) {
  videoSrc.value = item.uri;
}

function handleFile(file) {
  if (file && (file.name.endsWith('.m3u8') || file.type === 'application/vnd.apple.mpegurl' || file.name.endsWith('.m3u'))) {
    const reader = new FileReader();
    reader.onload = (e) => {
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
        videoSrc.value = '';
        currentPage.value = 1;
      } else {
        const url = URL.createObjectURL(file);
        m3u8Url.value = url;
        playVideo();
      }
    };
    reader.readAsText(file);
  } else {
    ElMessage.error('请上传一个有效的 .m3u8 或 .m3u 文件');
  }
}

function beforeUpload(file) {
  handleFile(file);
  // Prevent ElUpload's default upload behavior by returning false
  return false;
}
</script>

<template>
  <div class="main-container">
    <h1>M3U8 Player</h1>
    <div class="input-area">
      <el-input v-model="m3u8Url" placeholder="请输入 M3U8 地址"></el-input>
      <el-button type="primary" @click="playVideo">播放</el-button>
    </div>
    <div class="content-area" :class="{ 'has-playlist': fullPlaylist.length > 0 }">
      <div class="player-wrapper">
        <div class="player-container">
          <Player v-if="videoSrc" :src="videoSrc" />
          <el-upload
            v-else
            class="upload-dragger"
            drag
            action="#"
            :before-upload="beforeUpload"
            :show-file-list="false"
          >
            <div class="el-upload__text">
              将 .m3u8 文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </div>
      </div>
      <div v-if="fullPlaylist.length > 0" class="playlist-wrapper">
        <el-input v-model="searchQuery" placeholder="搜索标题..." clearable class="search-input"></el-input>
        <ul class="playlist">
          <li v-for="item in paginatedPlaylist" :key="item.id" @click="playFromPlaylist(item)">
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
    </div>
  </div>
</template>

<style scoped>
.main-container {
  max-width: 1600px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.input-area {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.content-area {
  display: grid;
  grid-template-columns: 1fr; /* Default to single column for mobile */
  gap: 2rem;
}

/* When playlist is visible, switch to two columns on PC */
.content-area.has-playlist {
  grid-template-columns: 3fr minmax(300px, 1fr);
}

.player-wrapper {
  min-width: 0;
}

.playlist-wrapper {
  text-align: left;
  max-height: calc(min(60vh, 800px * 9 / 16)); /* Match player's max aspect ratio height */
  display: flex;
  flex-direction: column;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
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

.pagination-container {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.player-container {
  border-radius: 8px;
  overflow: hidden;
  /* Remove black background from here */
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
}

.player-container > :deep(div),
.upload-dragger {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.upload-dragger {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ccc;
  background-color: #f8f8f8; /* Set a light background for the upload area */
}

.playlist li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist li:hover {
  background-color: #f5f5f5;
}

.playlist li:last-child {
  border-bottom: none;
}

/* Responsive adjustments */
@media (min-width: 992px) {
  .content-area.has-playlist {
    grid-template-columns: 3fr minmax(300px, 1fr);
  }
}

@media (max-width: 991.98px) {
  .content-area {
    grid-template-columns: 1fr; /* Force single column on smaller screens */
  }
  .main-container {
    margin: 1rem;
    padding: 1rem;
  }
  .playlist-wrapper {
    max-height: 40vh;
  }
}
</style>
