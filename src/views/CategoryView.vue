<template>
  <div v-if="category && hangout">
    <header class="page-header">
      <router-link :to="{ name: 'hangout', params: { id: hangout.id } }"><button class="btn-back">&lt;</button></router-link>
      <div>
        <h1>{{ category.name }}</h1>
        <p style="margin:0; opacity: 0.8;">Total: \${{ category.totalAmount.toFixed(2) }}</p>
      </div>
    </header>

    <div class="page-content">
        <!-- Amount Summary -->
        <div class="card summary-grid">
            <div>
                <p class="summary-label">Assigned</p>
                <p class="summary-value">\${{ assignedAmount.toFixed(2) }}</p>
            </div>
            <div>
                <p class="summary-label">Remaining</p>
                <p class="summary-value" :class="{ 'text-danger': remainingAmount !== 0, 'text-success': remainingAmount === 0 }">\${{ remainingAmount.toFixed(2) }}</p>
            </div>
        </div>

        <!-- Paid By Section -->
        <div class="card">
            <h2>Who Paid?</h2>
            <select v-model="category.paidBy" @change="saveHangout" class="payer-select">
                <option :value="null">Select Payer</option>
                <option v-for="person in hangout.people" :key="person.id" :value="person.id">
                    {{ person.name }}
                </option>
            </select>
        </div>

        <!-- Items Section -->
        <div class="card">
            <h2>Individual Items</h2>
            <div v-for="item in category.items" :key="item.id" class="list-item">
                <span>{{ getPersonName(item.personId) }}</span>
                <span>\${{ item.amount.toFixed(2) }}</span>
            </div>
            <button @click="showAddItemDialog = true" class="btn-secondary" style="width:100%; margin-top: 16px;">+ Add Item</button>
            <button class="btn-secondary" style="width:100%; margin-top: 8px; background-color: var(--tertiary);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                Scan Receipt (WIP)
            </button>
        </div>
    </div>

    <!-- Add Item Dialog -->
    <div v-if="showAddItemDialog" class="dialog-overlay" @click.self="showAddItemDialog = false">
      <div class="dialog-content">
        <h3>Add Item</h3>
        <select v-model="newItemPersonId" class="payer-select" style="margin-bottom: 8px;">
            <option value="">Select Person</option>
            <option v-for="person in hangout.people" :key="person.id" :value="person.id">{{ person.name }}</option>
        </select>
        <input type="number" v-model="newItemAmount" placeholder="Amount">
        <button @click="addItem" class="btn-primary" style="width: 100%; margin-top: 16px;">Add Item</button>
      </div>
    </div>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';

export default {
    data() {
        return {
            hangout: null,
            category: null,
            showAddItemDialog: false,
            newItemPersonId: '',
            newItemAmount: '',
        }
    },
    computed: {
        assignedAmount() {
            if (!this.category) return 0;
            return this.category.items.reduce((sum, item) => sum + item.amount, 0);
        },
        remainingAmount() {
            if (!this.category) return 0;
            // Use toFixed to handle floating point inaccuracies
            return parseFloat((this.category.totalAmount - this.assignedAmount).toFixed(2));
        }
    },
    created() {
        this.loadData();
    },
    methods: {
        loadData() {
            const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
            this.hangout = hangouts.find(h => h.id === this.$route.params.hangoutId);
            if (this.hangout) {
                this.category = this.hangout.categories.find(c => c.id === this.$route.params.categoryId);
            }
        },
        saveHangout() {
            const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
            const hangoutIndex = hangouts.findIndex(h => h.id === this.hangout.id);
            if (hangoutIndex !== -1) {
                const categoryIndex = hangouts[hangoutIndex].categories.findIndex(c => c.id === this.category.id);
                if (categoryIndex !== -1) {
                    hangouts[hangoutIndex].categories[categoryIndex] = this.category;
                }
            }
            localStorage.setItem('split_bill_hangouts', JSON.stringify(hangouts));
        },
        getPersonName(personId) {
            const person = this.hangout.people.find(p => p.id === personId);
            return person ? person.name : 'Unknown';
        },
        addItem() {
            if (!this.newItemPersonId || !this.newItemAmount) return;
            const newItem = {
                id: uuidv4(),
                personId: this.newItemPersonId,
                amount: parseFloat(this.newItemAmount)
            };
            this.category.items.push(newItem);
            this.saveHangout();
            this.newItemPersonId = '';
            this.newItemAmount = '';
            this.showAddItemDialog = false;
        }
    }
}
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
.summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    text-align: center;
}
.summary-label {
    margin: 0 0 4px;
    color: var(--tertiary);
}
.summary-value {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}
.text-danger { color: var(--danger); }
.text-success { color: var(--success); }
.payer-select {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--tertiary);
    font-size: 16px;
    background-color: var(--white);
}
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--base);
  border-radius: 8px;
  margin-bottom: 8px;
}
</style>