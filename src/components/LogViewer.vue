<template>
  <div class="log-viewer-container">
    <h1 class="title">数据分析中心</h1>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- 全站分析 Tab -->
      <el-tab-pane label="全站分析" name="overall">
        <div v-if="loading" v-loading="loading" class="loading-spinner"></div>
        <div v-if="!loading && overallAnalysis">
          <el-row :gutter="20" class="stat-cards">
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="stat-title">总日志数量</div>
                <div class="stat-value">{{ overallAnalysis.totalLogs }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="stat-title">全站IP数量</div>
                <div class="stat-value">{{ overallAnalysis.uniqueIps }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="stat-title">视频总数</div>
                <div class="stat-value">{{ overallAnalysis.uniqueVideos }}</div>
              </el-card>
            </el-col>
          </el-row>
          <el-card shadow="never" class="top-videos-card">
            <template #header>
              <span>播放次数最多的20个视频</span>
            </template>
            <el-table :data="overallAnalysis.topVideos" stripe>
              <el-table-column prop="video_title" label="视频标题"></el-table-column>
              <el-table-column prop="play_count" label="播放次数" width="120" align="center"></el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="scope">
                  <el-button size="small" @click="previewVideo(scope.row)">预览</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 用户分析 Tab -->
      <el-tab-pane label="用户分析" name="user">
        <div class="controls">
          <el-select filterable v-model="ipFilter" placeholder="选择IP进行用户分析" clearable>
            <el-option v-for="ip in uniqueIps" :key="ip" :label="ip" :value="ip" />
          </el-select>
        </div>
        <div v-if="loading" v-loading="loading" class="loading-spinner"></div>
        <div v-if="!loading && ipFilter && userAnalysis" class="analysis-panel">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="stat-title">日志总数</div>
                <div class="stat-value">{{ userAnalysis.totalLogs }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="stat-title">全站活跃度排名</div>
                <div class="stat-value">#{{ userAnalysis.rank }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="stat-title">最常观看视频</div>
                <div class="stat-value">{{ userAnalysis.favoriteVideo?.[0]?.video_title || 'N/A' }}</div>
              </el-card>
            </el-col>
          </el-row>
          <el-card shadow="never" class="top-videos-card" v-if="userAnalysis.favoriteVideo && userAnalysis.favoriteVideo.length > 0">
            <template #header>
              <span>Top 10 最常观看视频</span>
            </template>
            <el-table :data="userAnalysis.favoriteVideo" stripe>
              <el-table-column prop="video_title" label="视频标题"></el-table-column>
              <el-table-column prop="play_count" label="观看次数" width="120" align="center"></el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="scope">
                  <el-button size="small" @click="previewVideo(scope.row)">预览</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
        <el-empty v-if="!ipFilter" description="请选择一个IP地址进行分析"></el-empty>
      </el-tab-pane>

      <!-- 实时数据 Tab -->
      <el-tab-pane label="实时数据" name="logs">
        <div class="controls">
          <el-select filterable v-model="ipTableFilter" placeholder="筛选表格中的IP地址" clearable>
            <el-option v-for="ip in uniqueIps" :key="ip" :label="ip" :value="ip" />
          </el-select>
        </div>
        <div v-if="loading" v-loading="loading" class="loading-spinner"></div>
        <el-table v-if="!loading && logs?.length > 0" :data="logs" stripe border>
          <el-table-column prop="created_at" label="Timestamp" width="180">
            <template #default="scope">{{ new Date(scope.row.created_at).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="event" label="Event" width="120" />
          <el-table-column prop="ip" label="IP Address" width="150" />
          <el-table-column prop="video_title" label="Video Title" />
          <el-table-column prop="current_time" label="Current Time" width="120" />
          <el-table-column label="Actions" width="120">
            <template #default="scope">
              <el-button size="small" @click="viewInPlayer(scope.row)">View</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!loading && logs?.length === 0 && attempted" class="no-logs-message">
          <el-empty description="没有找到日志"></el-empty>
        </div>
        <div v-if="!loading && total > 0" class="pagination-container">
          <el-pagination :current-page="currentPage" :page-sizes="[10, 20, 50, 100]" :page-size="pageSize" :total="total"
            layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
            @current-change="handlePageChange" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <div v-if="error" class="error-message">
      <el-alert :title="error" type="error" show-icon :closable="false" />
    </div>

    <el-dialog v-model="dialogVisible" :title="previewTitle" width="60%" @close="dialogVisible = false">
      <Player v-if="dialogVisible" :src="previewSrc" :start-time="previewTime" :title="previewTitle" :is-preview="true" />
    </el-dialog>
  </div>
</template>

<script>
import Player from './Player.vue';

export default {
  components: { Player },
  data() {
    return {
      logs: [],
      loading: false,
      error: null,
      attempted: false,
      currentPage: 1,
      pageSize: 20,
      total: 0,
      dialogVisible: false,
      previewSrc: '',
      previewTime: 0,
      previewTitle: 'Video Preview',
      pollingInterval: null,
      uniqueIps: [],
      
      activeTab: 'overall', // Default tab
      
      // Tab: Overall Analysis
      overallAnalysis: null,

      // Tab: User Analysis
      ipFilter: '', // For user analysis selection
      userAnalysis: null,

      // Tab: Real-time Data
      ipTableFilter: '', // For filtering the log table
    };
  },
  watch: {
    ipFilter(newIp) {
      if (newIp) {
        this.fetchUserAnalysis(newIp);
      } else {
        this.userAnalysis = null;
      }
    },
    ipTableFilter() {
      this.currentPage = 1;
      this.fetchLogs(true);
    },
    activeTab(newTab, oldTab) {
      // Clear polling interval when leaving the logs tab
      if (oldTab === 'logs' && this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      this.loadDataForCurrentTab();
    }
  },
  mounted() {
    this.fetchUniqueIps();
    this.loadDataForCurrentTab();
  },
  beforeUnmount() {
    clearInterval(this.pollingInterval);
  },
  methods: {
    handleTabClick() {
      this.loadDataForCurrentTab();
    },
    loadDataForCurrentTab() {
      this.error = null;
      
      // Stop any existing polling before switching
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      if (this.activeTab === 'overall') {
        this.fetchOverallAnalysis();
      } else if (this.activeTab === 'user') {
        if (this.ipFilter) {
          this.fetchUserAnalysis(this.ipFilter);
        }
      } else if (this.activeTab === 'logs') {
        this.fetchLogs(true);
        // Only start polling if we are on the logs tab
        this.pollingInterval = setInterval(() => this.fetchLogs(false), 5000);
      }
    },
    async fetchApi(endpoint, params, isInitialLoad = false) {
      if (isInitialLoad) this.loading = true;
      this.error = null;
      
      const password = this.$route.query.pd;
      if (!password) {
        this.error = 'Password is required. Please provide it in the URL query parameter "pd".';
        this.loading = false;
        return null;
      }
      
      params.set('pd', password);

      try {
        const response = await fetch(`/api/${endpoint}?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch ${endpoint}`);
        }
        return await response.json();
      } catch (err) {
        this.error = err.message;
        return null;
      } finally {
        if (isInitialLoad) this.loading = false;
      }
    },
    async fetchOverallAnalysis() {
      const data = await this.fetchApi('overall', new URLSearchParams(), true);
      if (data) {
        this.overallAnalysis = data;
      }
    },
    async fetchUserAnalysis(ip) {
      const params = new URLSearchParams({ ip });
      const data = await this.fetchApi('analyze', params, true);
      if (data) {
        this.userAnalysis = data;
      }
    },
    async fetchLogs(isInitialLoad = false) {
      this.attempted = true;
      const params = new URLSearchParams({
        page: this.currentPage,
        pageSize: this.pageSize,
      });
      if (this.ipTableFilter) {
        params.append('ip', this.ipTableFilter);
      }
      
      // Use a modified fetch logic for logs to handle polling without constant loading spinners
      if (isInitialLoad) this.loading = true;
      this.error = null;
      const password = this.$route.query.pd;
      if (!password) {
        this.error = 'Password is required.';
        this.loading = false;
        return;
      }
      params.set('pd', password);

      try {
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
        if (isInitialLoad) this.loading = false;
      }
    },
    async fetchUniqueIps() {
      const password = this.$route.query.pd;
      if (!password) return;
      try {
        const response = await fetch(`/api/ips?pd=${encodeURIComponent(password)}`);
        if (!response.ok) throw new Error('Failed to fetch unique IPs');
        this.uniqueIps = await response.json();
      } catch (err) {
        console.error('Error fetching unique IPs:', err);
      }
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
      this.fetchLogs();
    },
    handleSizeChange(newSize) {
      this.pageSize = newSize;
      this.currentPage = 1;
      this.fetchLogs();
    },
    viewInPlayer(row) {
      this.previewSrc = row.video_src;
      this.previewTime = row.current_time;
      this.previewTitle = row.video_title || 'Video Preview';
      this.dialogVisible = true;
    },
    previewVideo(video) {
      this.previewSrc = video.video_src;
      this.previewTime = 0;
      this.previewTitle = video.video_title || 'Video Preview';
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
.controls {
  text-align: center;
  margin-bottom: 20px;
}
.loading-spinner {
  height: 300px;
}
.error-message {
  margin-bottom: 20px;
}
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
.stat-cards {
  margin-bottom: 20px;
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
}
.top-videos-card {
  margin-top: 20px;
}
.el-select {
  width: 300px;
}
</style>