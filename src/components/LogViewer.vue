<template>
  <div class="log-viewer-container">
    <h1 class="title">Log Viewer</h1>
    <div v-if="error" class="error-message">
      <el-alert :title="error" type="error" show-icon :closable="false" />
    </div>
    <div v-if="loading" v-loading="loading" class="loading-spinner"></div>
    <el-table v-if="!loading && logs.length > 0" :data="logs" stripe border style="width: 100%">
      <el-table-column prop="created_at" label="Timestamp" width="180">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="event" label="Event" width="120" />
      <el-table-column prop="ip" label="IP Address" width="150" />
      <el-table-column prop="video_src" label="Video Src" />
      <el-table-column prop="current_time" label="Current Time" width="120" />
      <el-table-column prop="user_agent" label="User Agent" />
    </el-table>
    <div v-if="!loading && logs.length === 0 && attempted" class="no-logs-message">
      <el-empty description="No logs found."></el-empty>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      logs: [],
      loading: false,
      error: null,
      attempted: false,
    };
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
        const response = await fetch(`/api/log?pd=${encodeURIComponent(password)}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch logs');
        }

        this.logs = await response.json();
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
</style>