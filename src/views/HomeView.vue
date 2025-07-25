<template>
  <div>
    <header class="page-header" style="justify-content: center;">
      <h1>Split Bill</h1>
    </header>

    <div class="page-content">
      <button @click="showCreateDialog = true" class="btn-primary" style="width: 100%; margin-bottom: 24px; padding: 16px; font-size: 1.2rem;">
        + Create New Hangout
      </button>

      <h2><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>Previous Hangouts</h2>
      <div v-if="hangouts.length === 0" class="card">
        <p>No hangouts yet. Create your first one!</p>
      </div>
      <div v-else>
        <div v-for="hangout in hangouts" :key="hangout.id" class="card" @click="goToHangout(hangout.id)">
          <div class="hangout-item">
            <div>
              <h3>{{ hangout.name }}</h3>
              <p class="date">{{ new Date(hangout.date).toLocaleDateString() }}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Hangout Dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>New Hangout</h3>
          <button @click="showCreateDialog = false" class="close-btn">&times;</button>
        </div>
        <input type="text" v-model="newHangoutName" placeholder="e.g., Dinner with Friends">
        <button @click="createHangout" class="btn-primary" style="width: 100%; margin-top: 16px;">Create</button>
      </div>
    </div>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';

export default {
  data() {
    return {
      hangouts: [],
      showCreateDialog: false,
      newHangoutName: '',
    };
  },
  created() {
    this.loadHangouts();
  },
  methods: {
    loadHangouts() {
      const data = localStorage.getItem('split_bill_hangouts');
      if (data) {
        this.hangouts = JSON.parse(data);
      }
    },
    saveHangouts() {
      localStorage.setItem('split_bill_hangouts', JSON.stringify(this.hangouts));
    },
    createHangout() {
      if (!this.newHangoutName.trim()) return;
      const newHangout = {
        id: uuidv4(),
        name: this.newHangoutName.trim(),
        date: new Date(),
        people: [],
        categories: [],
      };
      this.hangouts.unshift(newHangout);
      this.saveHangouts();
      this.newHangoutName = '';
      this.showCreateDialog = false;
      this.$router.push({ name: 'hangout', params: { id: newHangout.id } });
    },
    goToHangout(id) {
      this.$router.push({ name: 'hangout', params: { id } });
    }
  }
};
</script>

<style scoped>
.hangout-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.hangout-item h3 {
  margin: 0;
}
.hangout-item .date {
  margin: 4px 0 0;
  color: var(--tertiary);
  font-size: 0.9rem;
}
</style>