<template>
  <div class="log-viewer-container">
    <h1 class="title">Log Viewer</h1>
    <div class="controls">
      <el-select filterable v-model="ipFilter" placeholder="Filter by IP Address" clearable
        style="width: 240px; margin-right: 10px;">
        <el-option v-for="ip in uniqueIps" :key="ip" :label="ip" :value="ip" />
      </el-select>
    </div>

    <!-- User Analysis Panel -->
    <div v-if="ipFilter && analysis" class="analysis-panel">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover">
            <div class="stat-title">日志总数</div>
            <div class="stat-value">{{ analysis.totalLogs }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <div class="stat-title">全站活跃度排名</div>
            <div class="stat-value">#{{ analysis.rank }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <div class="stat-title">最常观看视频</div>
            <div class="stat-value">{{ analysis.favoriteVideo || 'N/A' }}</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div v-if="error" class="error-message">
      <el-alert :title="error" type="error" show-icon :closable="false" />
    </div>
    <div v-if="loading" v-loading="loading" class="loading-spinner"></div>

    <!-- Log Table (shown only when no IP is selected for analysis) -->
    <div v-if="!ipFilter">
      <el-table v-if="!loading && logs?.length > 0" :data="logs" stripe border style="width: 100%">
        <el-table-column prop="created_at" label="Timestamp" width="180">
          <template #default="scope">
            {{ new Date(scope.row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="event" label="Event" width="120" />
        <el-table-column prop="ip" label="IP Address" width="150" />
        <el-table-column prop="video_title" label="video_title" />
        <el-table-column prop="current_time" label="Current Time" width="120" />

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
    </div>
    <el-dialog v-model="dialogVisible" :title="previewTitle" width="60%" @close="dialogVisible = false">
      <Player v-if="dialogVisible" :src="previewSrc" :start-time="previewTime" :title="previewTitle"
        :is-preview="true" />
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
      previewTitle: 'Video Preview',
      ipFilter: '',
      pollingInterval: null,
      uniqueIps: [],
      analysis: null, // To store user analysis data
    };
  },
  computed: {},
  watch: {
    ipFilter(newIp) {
      if (newIp) {
        // An IP is selected, fetch analysis data
        this.fetchUserAnalysis(newIp);
        this.logs = []; // Clear logs table
        this.total = 0;
      } else {
        // IP filter is cleared, fetch logs
        this.analysis = null;
        this.currentPage = 1;
        this.fetchLogs(true);
      }
    },
  },
  mounted() {
    this.fetchLogs(true); // Initial fetch with loading indicator
    this.fetchUniqueIps();
    // Polling will refetch the current page
    this.pollingInterval = setInterval(() => this.fetchLogs(false), 5000);
  },
  beforeUnmount() {
    clearInterval(this.pollingInterval);
  },
  methods: {
    async fetchLogs(isInitialLoad = false) {
      if (isInitialLoad) {
        this.loading = true;
      }
      this.error = null;
      this.attempted = true;

      const password = this.$route.query.pd;

      if (!password) {
        this.error = 'Password is required. Please provide it in the URL query parameter "pd".';
        this.loading = false;
        return;
      }

      try {
        const params = new URLSearchParams({
          pd: password,
          page: this.currentPage,
          pageSize: this.pageSize,
        });
        if (this.ipFilter) {
          params.append('ip', this.ipFilter);
        }

        const response = await fetch(`/api/log?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch logs');
        }

        const { data, count } = await response.json();
        this.logs = data;
        this.total = count;
      } catch (err) {
        this.error = err.message;
      } finally {
        if (isInitialLoad) {
          this.loading = false;
        }
      }
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
      this.fetchLogs();
    },
    handleSizeChange(newSize) {
      this.pageSize = newSize;
      this.currentPage = 1; // Reset to first page
      this.fetchLogs();
    },
    async fetchUniqueIps() {
      const password = this.$route.query.pd;
      if (!password) return;

      try {
        const response = await fetch(`/api/ips?pd=${encodeURIComponent(password)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch unique IPs');
        }
        this.uniqueIps = await response.json();
      } catch (err) {
        console.error('Error fetching unique IPs:', err);
        // Silently fail, as this is not critical for the main functionality
      }
    },
    viewInPlayer(row) {
      this.previewSrc = row.video_src;
      this.previewTime = row.current_time;
      this.previewTitle = row.video_title || 'Video Preview';
      this.dialogVisible = true;
    },
    async fetchUserAnalysis(ip) {
      this.loading = true;
      this.error = null;
      this.analysis = null;
      const password = this.$route.query.pd;

      if (!password) {
        this.error = 'Password is required for analysis.';
        this.loading = false;
        return;
      }

      try {
        const params = new URLSearchParams({
          pd: password,
          ip: ip,
        });
        const response = await fetch(`/api/analyze?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user analysis');
        }
        this.analysis = await response.json();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
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

.analysis-panel {
  margin-bottom: 24px;
}

.stat-title {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>