<template>
  <div v-if="hangout">
    <header class="page-header" style="padding: 0 1rem;">
      <router-link to="/">
        <button class="btn-back">&lt;</button>
      </router-link>

      <div style="text-align: left; flex-grow: 1; padding-left: 10px;">
        <h1 style="margin: 0;">{{ hangout.name }}</h1>
        <p style="margin: 0; opacity: 0.8;">{{ new Date(hangout.date).toLocaleDateString() }}</p>
      </div>

      <img src="/logo.png" alt="EZsplit Logo" style="height: 60px; padding: 5px 0" />
    </header>

    <div class="page-content">
      <div class="hangout-grid">
        <div>
          <!-- People Section -->
          <div class="card">
            <h2>People ({{ hangout.people.length }})</h2>
            <div v-for="person in hangout.people" :key="person.id" class="list-item">
              <span>{{ person.name }}</span>
              <button @click="removePerson(person.id)" class="btn-remove">&times;</button>
            </div>
            <button @click="showAddPersonDialog = true" class="btn-secondary" style="width:100%; margin-top: 16px;">+ Add Person</button>
          </div>
        </div>

        <!-- Categories Section -->
        <div class="card">
          <h2>Categories ({{ hangout.categories.length }})</h2>
          <div v-for="category in hangout.categories" :key="category.id" class="list-item-clickable" @click="goToCategory(category.id)">
              <div>
                  <span>{{ category.name }}</span>
                  <p class="item-subtext">Total: {{ displayAmount(category.totalAmount) }}</p>
              </div>
              <button @click.stop="removeCategory(category.id)" class="btn-remove">&times;</button>
          </div>
          <button @click="showAddCategoryDialog = true" class="btn-secondary" style="width:100%; margin-top: 16px;">+ Add Category</button>
        </div>
      </div>
      
      <button @click="goToResults" class="btn-primary" style="width: 100%; padding: 16px; font-size: 1.2rem; margin-top: 16px;">View Results</button>
    </div>

    <!-- Dialogs -->
    <div v-if="showAddPersonDialog" class="dialog-overlay" @click.self="showAddPersonDialog = false">
      <div class="dialog-content">
        <h3>Add Person</h3>
        <input type="text" v-model="newPersonName" placeholder="Person's Name">
        <button @click="addPerson" class="btn-primary" style="width: 100%; margin-top: 16px;">Add</button>
      </div>
    </div>
    <div v-if="showAddCategoryDialog" class="dialog-overlay" @click.self="showAddCategoryDialog = false">
      <div class="dialog-content">
        <h3>Add Category</h3>
        <input type="text" v-model="newCategoryName" placeholder="e.g., Food, Tickets">
        <input type="number" v-model="newCategoryTotal" placeholder="Total Bill Amount (inc. charges)" style="margin-top: 8px;">
        <button @click="addCategory" class="btn-primary" style="width: 100%; margin-top: 16px;">Add</button>
      </div>
    </div>
  </div>
  <div v-else class="page-content">Loading...</div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, loadCurrency } from '../utils/currency.js';

export default {
  name: 'HangoutView',
  data() {
    return {
      hangout: null,
      currency: 'IDR',
      showAddPersonDialog: false,
      newPersonName: '',
      showAddCategoryDialog: false,
      newCategoryName: '',
      newCategoryTotal: '',
    };
  },
  created() {
    this.currency = loadCurrency();
    this.loadHangout();
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
    
    displayAmount(amount) {
      return formatCurrency(amount, this.currency);
    },
    loadHangout() {
      const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
      this.hangout = hangouts.find(h => h.id === this.$route.params.id);
    },
    saveHangout() {
      const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
      const index = hangouts.findIndex(h => h.id === this.hangout.id);
      if (index !== -1) { hangouts[index] = this.hangout; }
      localStorage.setItem('split_bill_hangouts', JSON.stringify(hangouts));
    },
    addPerson() {
      if (!this.newPersonName.trim()) return;
      this.hangout.people.push({ id: uuidv4(), name: this.newPersonName.trim() });
      this.saveHangout();
      this.newPersonName = '';
      this.showAddPersonDialog = false;
    },
    removePerson(personId) {
      this.hangout.people = this.hangout.people.filter(p => p.id !== personId);
      this.hangout.categories.forEach(cat => { cat.items = cat.items.filter(item => item.personId !== personId); });
      this.saveHangout();
    },
    addCategory() {
      if (!this.newCategoryName.trim() || !this.newCategoryTotal) return;
      const totalAmount = parseFloat(this.newCategoryTotal);
      this.hangout.categories.push({
        id: uuidv4(),
        name: this.newCategoryName.trim(),
        totalAmount: totalAmount,
        subtotal: totalAmount,
        taxRate: 0, // Tax rate is now per-category
        hasTax: false,
        hasService: false,
        serviceCharge: 0,
        hasDelivery: false,
        deliveryCharge: 0,
        items: [],
        paidBy: null,
      });
      this.saveHangout();
      this.newCategoryName = '';
      this.newCategoryTotal = '';
      this.showAddCategoryDialog = false;
    },
    removeCategory(categoryId) {
      this.hangout.categories = this.hangout.categories.filter(c => c.id !== categoryId);
      this.saveHangout();
    },
    goToCategory(categoryId) {
      this.$router.push({ name: 'category', params: { hangoutId: this.hangout.id, categoryId: categoryId } });
    },
    goToResults() {
      this.$router.push({ name: 'results', params: { id: this.hangout.id } });
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
.btn-back { background: var(--secondary); color: var(--white); border-radius: 50%; width: 40px; height: 40px; padding: 0; font-size: 1.5rem; line-height: 1; }
.list-item, .list-item-clickable { display: flex; justify-content: space-between; align-items: center; padding: 12px; background-color: var(--base); border-radius: 8px; margin-bottom: 8px; }
.list-item-clickable { cursor: pointer; }
.item-subtext { margin: 4px 0 0; font-size: 0.8rem; color: var(--tertiary); }
.btn-remove { background: none; border: none; color: var(--danger); font-size: 1.5rem; font-weight: 700; cursor: pointer; }
.input-label { display:block; margin-bottom: 8px; font-weight: 500; }

@media (min-width: 768px) {
  .hangout-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 24px;
    align-items: start;
  }
}
</style>