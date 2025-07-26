<template>
  <div>
    <header class="page-header">
      <img src="/logo.png" alt="EZsplit Logo" style="height: 54px; margin-right: 10px;" />
      <h1 style="flex-grow: 1; text-align: center;">EZsplit</h1>
      <button @click="showSettingsDialog = true" class="btn-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      </button>
    </header>

    <div class="page-content">
      <button @click="showCreateDialog = true" class="btn-primary" style="width: 100%; margin-bottom: 24px; padding: 16px; font-size: 1.2rem;">+ Create New Hangout</button>

      <h2>Previous Hangouts</h2>
      <div v-if="hangouts.length === 0" class="card"><p>No hangouts yet. Create your first one!</p></div>
      <div v-else>
        <div v-for="hangout in hangouts" :key="hangout.id" class="card">
          <div class="hangout-item">
            <div class="hangout-info" @click="goToHangout(hangout.id)">
              <h3>{{ hangout.name }}</h3>
              <p class="date">{{ new Date(hangout.date).toLocaleDateString() }}</p>
            </div>
            <div class="hangout-actions">
              <button @click.stop="removeHangout(hangout.id)" class="btn-delete-hangout" title="Delete Hangout">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
              <svg @click="goToHangout(hangout.id)" class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </div>
    </div>

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
    
    <div v-if="showSettingsDialog" class="dialog-overlay" @click.self="showSettingsDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Settings</h3>
          <button @click="showSettingsDialog = false" class="close-btn">&times;</button>
        </div>
        <label for="currency-select" style="display: block; margin-bottom: 8px; font-weight: 500;">Currency</label>
        <select id="currency-select" v-model="currency" @change="saveCurrency" class="payer-select">
          <option value="IDR">Indonesian Rupiah (Rp)</option>
          <option value="USD">United States Dollar ($)</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'HomeView',
  data() {
    return {
      hangouts: [],
      showCreateDialog: false,
      newHangoutName: '',
      showSettingsDialog: false,
      currency: 'IDR',
    };
  },
  created() {
    this.loadHangouts();
    this.currency = localStorage.getItem('split_bill_currency') || 'IDR';
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    handleScroll() {
      const header = document.querySelector('.page-header');
      if (window.scrollY > 50) {
          header?.classList.add('translucent');
      } else {
          header?.classList.remove('translucent');
      }
    },
    
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
        taxRate: 0,
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
    },
    removeHangout(id) {
      if (confirm("Are you sure you want to delete this hangout? This action cannot be undone.")) {
          this.hangouts = this.hangouts.filter(hangout => hangout.id !== id);
          this.saveHangouts();
      }
    },
    saveCurrency() {
      localStorage.setItem('split_bill_currency', this.currency);
    }
  }
};
</script>

<style scoped>
.page-header {
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 999;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: opacity 0.5s ease;
}
.page-header.translucent {
  opacity: 75%;
  backdrop-filter: blur(6px);
}
.btn-delete-hangout {
    background: none;
    border: none;
    color: var(--danger);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
}
.btn-delete-hangout:hover {
    background-color: #fee2e2;
}
.hangout-item { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.hangout-item h3 { margin: 0; }
.hangout-item .date { margin: 4px 0 0; color: var(--tertiary); font-size: 0.9rem; }
</style>