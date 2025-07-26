<template>
  <div v-if="category && hangout">
    <header class="page-header" style="padding: 0 1rem;">
      <router-link :to="{ name: 'hangout', params: { id: hangout.id } }"><button class="btn-back">&lt;</button></router-link>
      <div style="text-align: left; flex-grow: 1; padding-left: 10px;">
        <h1>{{ category.name }}</h1>
        <p style="margin:0; opacity: 0.8;">Final Total: {{ displayAmount(category.totalAmount) }}</p>
      </div>

      <img src="/logo.png" alt="EZsplit Logo" style="height: 60px; padding: 5px 0" />
    </header>

    <div class="page-content">
        <div class="card">
          <div class="tax-toggle-wrapper">
            <label class="tax-toggle-label">This category includes tax</label>
            <div class="toggle-switch" @click="toggleTax"><div class="knob" :class="{ 'active': category.hasTax }"></div></div>
          </div>
          <hr class="divider">
          <div class="tax-toggle-wrapper">
            <label class="tax-toggle-label">This category includes service charge</label>
            <div class="toggle-switch" @click="toggleService"><div class="knob" :class="{ 'active': category.hasService }"></div></div>
          </div>
           <hr class="divider">
          <div class="tax-toggle-wrapper">
            <label class="tax-toggle-label">This category includes delivery charge</label>
            <div class="toggle-switch" @click="toggleDelivery"><div class="knob" :class="{ 'active': category.hasDelivery }"></div></div>
          </div>
        </div>

        <div v-if="category.hasTax || category.hasService || category.hasDelivery" class="card">
            <h2>Charges Breakdown</h2>
            <div class="actual-tax-input" style="margin-bottom: 16px;">
                <label for="subtotal"><strong>Subtotal (before charges):</strong></label>
                <input id="subtotal" type="number" v-model.number="category.subtotal" @change="saveHangout" placeholder="Bill before charges">
            </div>
            <div v-if="category.hasTax" class="tax-details-section">
                <div class="actual-tax-input" style="margin-bottom: 16px;">
                    <label for="tax-rate"><strong>Tax Rate (%):</strong></label>
                    <input id="tax-rate" type="number" v-model.number="category.taxRate" @change="saveHangout" placeholder="e.g., 11">
                </div>
                <div class="tax-details">
                    <div><strong>Expected Tax ({{ category.taxRate }}%):</strong> {{ displayAmount(expectedTax) }}</div>
                    <div><strong>Actual Tax (from Subtotal):</strong> {{ displayAmount(actualTax) }}</div>
                </div>
            </div>
            <hr v-if="category.hasTax && (category.hasService || category.hasDelivery)" class="divider">
            <div v-if="category.hasService" class="tax-details-section">
                <div class="actual-tax-input">
                    <label for="actual-service"><strong>Service Charge Amount:</strong></label>
                    <input id="actual-service" type="number" v-model.number="category.serviceCharge" @change="saveHangout" placeholder="From receipt">
                </div>
            </div>
             <hr v-if="category.hasService && category.hasDelivery" class="divider">
            <div v-if="category.hasDelivery" class="tax-details-section">
                <div class="actual-tax-input">
                    <label for="delivery-charge"><strong>Delivery Charge Amount:</strong></label>
                    <input id="delivery-charge" type="number" v-model.number="category.deliveryCharge" @change="saveHangout" placeholder="From receipt">
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Who Paid?</h2>
            <select v-model="category.paidBy" @change="saveHangout" class="payer-select">
                <option :value="null">Select Payer</option>
                <option v-for="person in hangout.people" :key="person.id" :value="person.id">{{ person.name }}</option>
            </select>
        </div>

        <!-- Equal Split Card -->
        <div class="card">
            <h2>Quick Actions</h2>
            <button @click="openEqualSplitDialog" class="btn-secondary" style="width:100%;">Split Subtotal Equally</button>
        </div>

        <div class="card">
            <h2>Item Breakdown (Subtotal)</h2>
            <div v-if="category.items.length === 0" class="empty-state">
                <p>No items added yet. Add items manually or use the equal split action.</p>
            </div>
            <div v-for="item in category.items" :key="item.id" class="list-item">
                <div class="item-info">
                    <span>{{ getPersonName(item.personId) }}</span>
                    <span class="item-amount">{{ displayAmount(item.amount) }}</span>
                </div>
                <div class="item-actions">
                    <button @click="openEditDialog(item)" class="btn-edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button @click="removeItem(item.id)" class="btn-remove">&times;</button>
                </div>
            </div>
            <button @click="showAddItemDialog = true" class="btn-secondary" style="width:100%; margin-top: 16px;">+ Add Item Manually</button>
            <ReceiptScanner @scan-complete="handleScanComplete" :currency="currency" />
        </div>
        
        <div v-if="splitSummary.length > 0" class="card">
            <h2>Split Summary</h2>
            <div v-for="personSummary in splitSummary" :key="personSummary.personId" class="summary-item">
                <h3>{{ personSummary.personName }}</h3>
                <div class="summary-details">
                    <div><span>Items Subtotal:</span> {{ displayAmount(personSummary.itemsSubtotal) }}</div>
                    <div v-if="category.hasTax"><span>Tax Share:</span> {{ displayAmount(personSummary.taxShare) }}</div>
                    <div v-if="category.hasService"><span>Service Share:</span> {{ displayAmount(personSummary.serviceShare) }}</div>
                    <div v-if="category.hasDelivery"><span>Delivery Share:</span> {{ displayAmount(personSummary.deliveryShare) }}</div>
                    <hr class="divider">
                    <div><strong>Total:</strong> <strong>{{ displayAmount(personSummary.personTotal) }}</strong></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Dialogs -->
    <div v-if="showEqualSplitDialog" class="dialog-overlay" @click.self="showEqualSplitDialog = false">
        <div class="dialog-content">
            <div class="dialog-header">
                <h3>Select People to Split With</h3>
                <button @click="showEqualSplitDialog = false" class="close-btn">&times;</button>
            </div>
            <div class="people-checklist">
                <div v-for="person in hangout.people" :key="person.id" class="checklist-item">
                    <input type="checkbox" :id="'person-' + person.id" :value="person.id" v-model="selectedPeopleForSplit">
                    <label :for="'person-' + person.id">{{ person.name }}</label>
                </div>
            </div>
            <button @click="confirmEqualSplit" class="btn-primary" style="width: 100%; margin-top: 16px;">Confirm Split</button>
        </div>
    </div>

    <AssignItemsDialog 
        v-if="showAssignDialog" 
        :scannedItems="scannedItems"
        :people="hangout.people"
        @close="showAssignDialog = false"
        @save-assignments="handleSaveAssignments"
    />
     <div v-if="showAddItemDialog" class="dialog-overlay" @click.self="showAddItemDialog = false">
      <div class="dialog-content">
        <h3>Add Item (Amount before charges)</h3>
        <select v-model="newItemPersonId" class="payer-select" style="margin-bottom: 8px;">
            <option value="">Select Person</option>
            <option v-for="person in hangout.people" :key="person.id" :value="person.id">{{ person.name }}</option>
        </select>
        <input type="number" v-model="newItemAmount" placeholder="Amount">
        <button @click="addItem" class="btn-primary" style="width: 100%; margin-top: 16px;">Add Item</button>
      </div>
    </div>
    <div v-if="showEditItemDialog" class="dialog-overlay" @click.self="showEditItemDialog = false">
      <div v-if="editingItem" class="dialog-content">
        <h3>Edit Item</h3>
        <select v-model="editingItem.personId" class="payer-select" style="margin-bottom: 8px;">
            <option v-for="person in hangout.people" :key="person.id" :value="person.id">{{ person.name }}</option>
        </select>
        <input type="number" v-model.number="editingItem.amount" placeholder="Amount">
        <button @click="updateItem" class="btn-primary" style="width: 100%; margin-top: 16px;">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, loadCurrency } from '../utils/currency.js';
import ReceiptScanner from '../components/ReceiptScanner.vue';
import AssignItemsDialog from '../components/AssignItemsDialog.vue';

export default {
    name: 'CategoryView',
    components: {
      ReceiptScanner,
      AssignItemsDialog,
    },
    data() {
        return {
            hangout: null,
            category: null,
            currency: 'IDR',
            showAddItemDialog: false,
            newItemPersonId: '',
            newItemAmount: '',
            showEditItemDialog: false,
            editingItem: null,
            showAssignDialog: false,
            scannedItems: [],
            showEqualSplitDialog: false,
            selectedPeopleForSplit: [],
        }
    },
    computed: {
        expectedTax() {
            if (!this.category) return 0;
            return this.category.subtotal * (this.category.taxRate / 100);
        },
        actualTax() {
            if (!this.category || !this.category.hasTax) return 0;
            let totalCharges = this.category.totalAmount - this.category.subtotal;
            let otherCharges = 0;
            if (this.category.hasService) otherCharges += this.category.serviceCharge;
            if (this.category.hasDelivery) otherCharges += this.category.deliveryCharge;
            return Math.max(0, totalCharges - otherCharges);
        },
        splitSummary() {
            if (!this.category || this.category.items.length === 0) return [];
            const participants = [...new Set(this.category.items.map(item => item.personId))];
            const numParticipants = participants.length;
            return participants.map(personId => {
                const person = this.hangout.people.find(p => p.id === personId);
                const itemsSubtotal = this.category.items.filter(item => item.personId === personId).reduce((sum, item) => sum + item.amount, 0);
                let taxShare = 0;
                if (this.category.hasTax && this.category.subtotal > 0) { taxShare = (itemsSubtotal / this.category.subtotal) * this.actualTax; }
                const serviceShare = this.category.hasService ? this.category.serviceCharge / numParticipants : 0;
                const deliveryShare = this.category.hasDelivery ? this.category.deliveryCharge / numParticipants : 0;
                const personTotal = itemsSubtotal + taxShare + serviceShare + deliveryShare;
                return { personId, personName: person ? person.name : 'Unknown', itemsSubtotal, taxShare, serviceShare, deliveryShare, personTotal };
            });
        }
    },
    created() {
        this.currency = loadCurrency();
        this.loadData();
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
        displayAmount(amount) { return formatCurrency(amount, this.currency); },
        loadData() {
            const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
            this.hangout = hangouts.find(h => h.id === this.$route.params.hangoutId);
            if (this.hangout) { this.category = this.hangout.categories.find(c => c.id === this.$route.params.categoryId); }
        },
        saveHangout() {
            const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
            const hangoutIndex = hangouts.findIndex(h => h.id === this.hangout.id);
            if (hangoutIndex !== -1) {
                const categoryIndex = hangouts[hangoutIndex].categories.findIndex(c => c.id === this.category.id);
                if (categoryIndex !== -1) { hangouts[hangoutIndex].categories[categoryIndex] = this.category; }
            }
            localStorage.setItem('split_bill_hangouts', JSON.stringify(hangouts));
        },
        getPersonName(personId) { const person = this.hangout.people.find(p => p.id === personId); return person ? person.name : 'Unknown'; },
        addItem() {
            if (!this.newItemPersonId || !this.newItemAmount) return;
            this.category.items.push({ id: uuidv4(), personId: this.newItemPersonId, amount: parseFloat(this.newItemAmount) });
            this.saveHangout();
            this.newItemPersonId = '';
            this.newItemAmount = '';
            this.showAddItemDialog = false;
        },
        removeItem(itemId) {
            this.category.items = this.category.items.filter(item => item.id !== itemId);
            this.saveHangout();
        },
        openEditDialog(item) {
            this.editingItem = JSON.parse(JSON.stringify(item));
            this.showEditItemDialog = true;
        },
        updateItem() {
            const index = this.category.items.findIndex(item => item.id === this.editingItem.id);
            if (index !== -1) {
                this.category.items[index] = this.editingItem;
            }
            this.saveHangout();
            this.showEditItemDialog = false;
            this.editingItem = null;
        },
        toggleTax() { this.category.hasTax = !this.category.hasTax; this.updateSubtotal(); this.saveHangout(); },
        toggleService() { this.category.hasService = !this.category.hasService; this.updateSubtotal(); this.saveHangout(); },
        toggleDelivery() { this.category.hasDelivery = !this.category.hasDelivery; this.updateSubtotal(); this.saveHangout(); },
        updateSubtotal() {
            if (!this.category.hasTax && !this.category.hasService && !this.category.hasDelivery) {
                this.category.subtotal = this.category.totalAmount;
            }
        },
        handleScanComplete(scannedItems) {
            if (!scannedItems || scannedItems.length === 0) {
                alert('Could not find any items on the receipt. Please try again.');
                return;
            }
            this.scannedItems = scannedItems;
            this.showAssignDialog = true;
        },
        handleSaveAssignments(assignedItems) {
            assignedItems.forEach(assignedItem => {
                this.category.items.push({
                    id: uuidv4(),
                    personId: assignedItem.personId,
                    amount: assignedItem.total,
                });
            });
            this.saveHangout();
            this.showAssignDialog = false;
            this.scannedItems = [];
        },

        openEqualSplitDialog() {
            // Pre-select people part of an item
            const currentParticipants = [...new Set(this.category.items.map(item => item.personId))];
            this.selectedPeopleForSplit = currentParticipants.length > 0 ? currentParticipants : this.hangout.people.map(p => p.id);
            this.showEqualSplitDialog = true;
        },
        confirmEqualSplit() {
            if (this.selectedPeopleForSplit.length === 0) {
                alert("Please select at least one person to split with.");
                return;
            }
            const numPeople = this.selectedPeopleForSplit.length;
            const subtotalPerPerson = this.category.subtotal / numPeople;

            // Overwrite existing items with the equal split
            this.category.items = this.selectedPeopleForSplit.map(personId => ({
                id: uuidv4(),
                personId: personId,
                amount: subtotalPerPerson
            }));

            this.saveHangout();
            this.showEqualSplitDialog = false;
        },
    }
}
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
.tax-details-section { margin-bottom: 8px; }
.tax-details > div, .actual-tax-input { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.actual-tax-input input { max-width: 150px; text-align: right; }
.list-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background-color: var(--base); border-radius: 8px; margin-bottom: 8px; }
.item-info { display: flex; flex-direction: column; }
.item-amount { font-weight: 600; }
.item-actions { display: flex; align-items: center; gap: 8px; }
.btn-edit { background: none; border: none; cursor: pointer; color: var(--tertiary); padding: 4px; }
.btn-remove { background: none; border: none; color: var(--danger); font-size: 1.5rem; font-weight: 700; cursor: pointer; padding: 4px; line-height: 1; }
.tax-toggle-wrapper { display: flex; justify-content: space-between; align-items: center; }
.tax-toggle-label { font-weight: 600; }
.toggle-switch { width: 50px; height: 28px; background-color: var(--base); border-radius: 14px; cursor: pointer; display: flex; align-items: center; padding: 2px; }
.knob { width: 24px; height: 24px; background-color: white; border-radius: 50%; transition: transform 0.2s ease-in-out; }
.knob.active { transform: translateX(22px); background-color: var(--success); }
.divider { margin: 12px 0; border: none; border-top: 1px solid var(--base); }
.summary-item { padding: 12px; background-color: var(--base); border-radius: 8px; margin-bottom: 8px; }
.summary-item h3 { margin: 0 0 8px; }
.summary-details > div { display: flex; justify-content: space-between; }
</style>