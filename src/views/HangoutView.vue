<template>
  <div v-if="hangout">
    <header class="page-header">
      <router-link to="/"><button class="btn-back">&lt;</button></router-link>
      <div>
        <h1>{{ hangout.name }}</h1>
        <p style="margin:0; opacity: 0.8;">{{ new Date(hangout.date).toLocaleDateString() }}</p>
      </div>
    </header>

    <div class="page-content">
      <!-- People Section -->
      <div class="card">
        <h2>People ({{ hangout.people.length }})</h2>
        <div v-for="person in hangout.people" :key="person.id" class="list-item">
          <span>{{ person.name }}</span>
          <button @click="removePerson(person.id)" class="btn-remove">&times;</button>
        </div>
        <button @click="showAddPersonDialog = true" class="btn-secondary" style="width:100%; margin-top: 16px;">+ Add Person</button>
      </div>

      <!-- Categories Section -->
      <div class="card">
        <h2>Categories ({{ hangout.categories.length }})</h2>
        <div v-for="category in hangout.categories" :key="category.id" class="list-item-clickable" @click="goToCategory(category.id)">
            <div>
                <span>{{ category.name }}</span>
                <p class="item-subtext">Total: \${{ category.totalAmount.toFixed(2) }}</p>
            </div>
            <button @click.stop="removeCategory(category.id)" class="btn-remove">&times;</button>
        </div>
        <button @click="showAddCategoryDialog = true" class="btn-secondary" style="width:100%; margin-top: 16px;">+ Add Category</button>
      </div>
      
      <!-- Results Button -->
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
        <input type="number" v-model="newCategoryAmount" placeholder="Total Bill for Category" style="margin-top: 8px;">
        <button @click="addCategory" class="btn-primary" style="width: 100%; margin-top: 16px;">Add</button>
      </div>
    </div>
  </div>
  <div v-else>Loading...</div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';

export default {
  data() {
    return {
      hangout: null,
      showAddPersonDialog: false,
      newPersonName: '',
      showAddCategoryDialog: false,
      newCategoryName: '',
      newCategoryAmount: '',
    };
  },
  created() {
    this.loadHangout();
  },
  methods: {
    loadHangout() {
      const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
      this.hangout = hangouts.find(h => h.id === this.$route.params.id);
    },
    saveHangout() {
      const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
      const index = hangouts.findIndex(h => h.id === this.hangout.id);
      if (index !== -1) {
        hangouts[index] = this.hangout;
      }
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
      // Also remove them from any bill items
      this.hangout.categories.forEach(cat => {
          cat.items = cat.items.filter(item => item.personId !== personId);
      });
      this.saveHangout();
    },
    addCategory() {
      if (!this.newCategoryName.trim() || !this.newCategoryAmount) return;
      this.hangout.categories.push({
        id: uuidv4(),
        name: this.newCategoryName.trim(),
        totalAmount: parseFloat(this.newCategoryAmount),
        items: [],
        paidBy: null,
      });
      this.saveHangout();
      this.newCategoryName = '';
      this.newCategoryAmount = '';
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
.btn-back {
  background: var(--secondary);
  color: var(--white);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 1.5rem;
  line-height: 1;
}
.list-item, .list-item-clickable {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--base);
  border-radius: 8px;
  margin-bottom: 8px;
}
.list-item-clickable {
    cursor: pointer;
}
.list-item-clickable:hover {
    background-color: #c1bed4;
}
.item-subtext {
    margin: 4px 0 0;
    font-size: 0.8rem;
    color: var(--tertiary);
}
.btn-remove {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
}
</style>