<template>
  <div class="log-viewer-container">
    <h1 class="title">Log Viewer</h1>
    <div class="controls">
      <el-select v-model="ipFilter" placeholder="Filter by IP Address" clearable style="width: 240px; margin-right: 10px;">
        <el-option v-for="ip in uniqueIps" :key="ip" :label="ip" :value="ip" />
      </el-select>
    </div>
    <div v-if="error" class="error-message">
      <el-alert :title="error" type="error" show-icon :closable="false" />
    </div>
    <div v-if="loading" v-loading="loading" class="loading-spinner"></div>
    <el-table v-if="!loading && pagedLogs?.length > 0" :data="pagedLogs" stripe border style="width: 100%">
      <el-table-column prop="created_at" label="Timestamp" width="180">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="event" label="Event" width="120" />
      <el-table-column prop="ip" label="IP Address" width="150" />
      <el-table-column prop="video_src" label="Video Src" />
      <el-table-column prop="current_time" label="Current Time" width="120" />
      <el-table-column prop="video_title" label="video_title" />
      <el-table-column label="Actions" width="120">
        <template #default="scope">
          <el-button size="small" @click="viewInPlayer(scope.row)">View</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!loading && logs?.length === 0 && attempted" class="no-logs-message">
      <el-empty description="No logs found."></el-empty>
    </div>
    <div v-if="!loading && total > 0" class="pagination-container">
      <el-pagination :current-page="currentPage" :page-sizes="[10, 20, 50, 100]" :page-size="pageSize" :total="total"
        layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
        @current-change="handlePageChange" />
    </div>
    <el-dialog v-model="dialogVisible" title="Video Preview" width="60%" @close="dialogVisible = false">
      <Player v-if="dialogVisible" :src="previewSrc" :start-time="previewTime" />
    </el-dialog>
  </div>
</template>

<script>
import Player from './Player.vue';

export default {
  components: {
    Player,
  },
  data() {
    return {
      logs: [],
      ipCounts: [],
      loading: false,
      error: null,
      attempted: false,
      currentPage: 1,
      pageSize: 20,
      total: 0,
      viewMode: 'logs', // 'logs' or 'ip_counts'
      dialogVisible: false,
      previewSrc: '',
      previewTime: 0,
      ipFilter: '',
      // uniqueIps: [],
    };
  },
  computed: {
    uniqueIps() {
      const ips = new Set(this.logs.map(log => log.ip));
      return Array.from(ips).sort();
    },
    filteredLogs() {
      if (!this.ipFilter) {
        return this.logs;
      }
      return this.logs.filter(log => log.ip.includes(this.ipFilter));
    },
    pagedLogs() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredLogs.slice(start, end);
    },
  },
  watch: {
    filteredLogs: {
      handler(newLogs) {
        this.total = newLogs.length;
        this.currentPage = 1; // Reset to first page when filter changes
      },
      immediate: true,
    },
  },
  mounted() {
    this.fetchLogs();
  },
  methods: {
    async fetchLogs() {
      this.loading = true;
      this.error = null;
      this.attempted = true;
      this.logs = [];

      const password = this.$route.query.pd;

      if (!password) {
        this.error = 'Password is required. Please provide it in the URL query parameter "pd".';
        this.loading = false;
        return;
      }

      try {
        const response = await fetch(
          `/api/log?pd=${encodeURIComponent(password)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch logs');
        }

        const data = await response.json();
        this.logs = data;
        this.total = data.length;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
    handleSizeChange(newSize) {
      this.pageSize = newSize;
      this.currentPage = 1; // Reset to first page
    },
    viewInPlayer(row) {
      this.previewSrc = row.video_src;
      this.previewTime = row.current_time;
      this.dialogVisible = true;
    },
  },
};
</script>

<style scoped>
.log-viewer-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.title {
  font-size: 2rem;
  color: #303133;
  margin-bottom: 24px;
  text-align: center;
}

.error-message {
  margin-bottom: 20px;
}

.loading-spinner {
  height: 300px;
}

.no-logs-message {
  margin-top: 20px;
  text-align: center;
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.controls {
  text-align: center;
  margin-bottom: 20px;
}
</style>