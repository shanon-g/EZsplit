<template>
  <div v-if="hangout">
    <header class="page-header" style="padding: 0 1rem;">
      <router-link :to="{ name: 'hangout', params: { id: hangout.id } }"><button class="btn-back">&lt;</button></router-link>
      <div style="text-align: left; flex-grow: 1; padding-left: 10px;">
        <h1>Results</h1>
      </div>

      <img src="/logo.png" alt="EZsplit Logo" style="height: 60px; padding: 5px 0" />
    </header>

    <div class="page-content">
      <div class="card total-summary">
        <h2>Total Bill</h2>
        <p>{{ displayAmount(totalBill) }}</p>
      </div>

      <div class="card">
        <h2>Individual Summary</h2>
        <div class="summaries-grid">
            <div v-for="summary in summaries" :key="summary.id" class="summary-item">
                <h3>{{ summary.name }}</h3>
                <div class="summary-details">
                    <div><span>Spent:</span> {{ displayAmount(summary.spent) }}</div>
                    <div><span>Paid:</span> {{ displayAmount(summary.paid) }}</div>
                    <div>
                        <span>Balance:</span>
                        <span :class="{'text-success': summary.balance >= 0, 'text-danger': summary.balance < 0}">
                            {{ displayAmount(summary.balance) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div class="card">
        <h2>Who Owes Whom</h2>
        <div v-if="transactions.length === 0" class="settled"><p>🎉 CEPMEK Free from Debts!</p></div>
        <div v-else>
            <div v-for="(t, index) in transactions" :key="index" class="transaction-item">
                <span>{{ t.from }}</span>
                <span class="arrow">&rarr;</span>
                <span>{{ t.to }}</span>
                <span class="amount">{{ displayAmount(t.amount) }}</span>
            </div>
        </div>
      </div>
      <button @click="saveAsText" class="btn-secondary" style="width: 100%; margin-top: 16px;">Save as Text</button>
    </div>
  </div>
</template>

<script>
import { formatCurrency, loadCurrency } from '../utils/currency.js';

export default {
    name: 'ResultsView',
    data() {
        return {
            hangout: null,
            summaries: [],
            transactions: [],
            currency: 'IDR',
        }
    },
    computed: {
        totalBill() {
            if (!this.hangout) return 0;
            return this.hangout.categories.reduce((sum, cat) => sum + cat.totalAmount, 0);
        }
    },
    created() {
        this.currency = loadCurrency();
        this.loadAndCalculate();
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
        loadAndCalculate() {
            const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
            this.hangout = hangouts.find(h => h.id === this.$route.params.id);
            if (this.hangout) { this.calculateSummaries(); this.calculateTransactions(); }
        },
        
        calculateSummaries() {
            this.summaries = this.hangout.people.map(person => {
                let totalSpent = 0;
                let totalPaid = 0;

                // Loop through each category
                this.hangout.categories.forEach(cat => {
                    // Calculate what this person PAID for this category
                    if (cat.paidBy === person.id) {
                        totalPaid += cat.totalAmount;
                    }

                    // Create a list of unique people who have items in this category
                    const participants = [...new Set(cat.items.map(item => item.personId))];
                    if (!participants.includes(person.id)) {
                        return; // Skip person if no items in this category
                    }

                    // 1. Person's share of the items (subtotal)
                    const itemsSubtotalForPerson = cat.items
                        .filter(item => item.personId === person.id)
                        .reduce((sum, item) => sum + item.amount, 0);
                    
                    let personSpentInCategory = itemsSubtotalForPerson;

                    // 2. Person's share of charges for this category
                    const numParticipants = participants.length;
                    
                    // Proportional tax share
                    if (cat.hasTax && cat.subtotal > 0) {
                        const totalCharges = cat.totalAmount - cat.subtotal;
                        const otherCharges = (cat.hasService ? cat.serviceCharge : 0) + (cat.hasDelivery ? cat.deliveryCharge : 0);
                        const actualTax = Math.max(0, totalCharges - otherCharges);
                        personSpentInCategory += (itemsSubtotalForPerson / cat.subtotal) * actualTax;
                    }

                    // Equal service & delivery share
                    if (cat.hasService) personSpentInCategory += cat.serviceCharge / numParticipants;
                    if (cat.hasDelivery) personSpentInCategory += cat.deliveryCharge / numParticipants;
                    
                    totalSpent += personSpentInCategory;
                });
                
                return { 
                    id: person.id, 
                    name: person.name, 
                    spent: totalSpent, 
                    paid: totalPaid, 
                    balance: totalPaid - totalSpent 
                };
            });
        },

        calculateTransactions() {
            let transactionsMap = {};

            // 1. Build transactions normally (from categories)
            this.hangout.categories.forEach(cat => {
                const participants = cat.splitWith?.length > 0
                ? cat.splitWith
                : [...new Set(cat.items.map(item => item.personId))];

                const numParticipants = participants.length;
                if (numParticipants === 0) return;

                const payer = this.hangout.people.find(p => p.id === cat.paidBy);
                if (!payer) return;

                participants.forEach(participantId => {
                if (participantId === cat.paidBy) return;

                const participant = this.hangout.people.find(p => p.id === participantId);
                if (!participant) return;

                const itemsSubtotalForPerson = (cat.items || [])
                    .filter(item => item.personId === participantId)
                    .reduce((sum, item) => sum + item.amount, 0);

                let personShare = itemsSubtotalForPerson;

                if (cat.hasTax && cat.subtotal > 0) {
                    const totalCharges = cat.totalAmount - cat.subtotal;
                    const otherCharges = (cat.hasService ? cat.serviceCharge : 0) + (cat.hasDelivery ? cat.deliveryCharge : 0);
                    const taxAmount = Math.max(0, totalCharges - otherCharges);
                    personShare += (itemsSubtotalForPerson / cat.subtotal) * taxAmount;
                }

                if (cat.hasService) personShare += cat.serviceCharge / numParticipants;
                if (cat.hasDelivery) personShare += cat.deliveryCharge / numParticipants;

                const amount = Math.round(personShare * 100) / 100;
                const key = `${participant.name}->${payer.name}`;
                transactionsMap[key] = (transactionsMap[key] || 0) + amount;
                });
            });

            // 2. Normalize bidirectional debts
            const normalizedMap = {};

            Object.entries(transactionsMap).forEach(([key, amount]) => {
                const [from, to] = key.split("->");
                const reverseKey = `${to}->${from}`;

                if (normalizedMap[reverseKey]) {
                const reverseAmount = normalizedMap[reverseKey];
                if (reverseAmount > amount) {
                    normalizedMap[reverseKey] = Math.round((reverseAmount - amount) * 100) / 100;
                } else if (reverseAmount < amount) {
                    normalizedMap[key] = Math.round((amount - reverseAmount) * 100) / 100;
                    delete normalizedMap[reverseKey];
                } else {
                    delete normalizedMap[reverseKey];
                }
                } else {
                normalizedMap[key] = amount;
                }
            });

            // 3. Convert to array of transactions
            this.transactions = Object.entries(normalizedMap).map(([key, amount]) => {
                const [from, to] = key.split("->");
                return { from, to, amount };
            });
            },

        saveAsText() {
            const lines = [];
            lines.push(`Bill Splitting Results for: ${this.hangout.name}`);
            lines.push(`Total Bill: ${this.displayAmount(this.totalBill)}`);
            lines.push('');
            lines.push('--- Individual Summaries ---');
            this.summaries.forEach(s => { lines.push(`${s.name} | Spent: ${this.displayAmount(s.spent)}, Paid: ${this.displayAmount(s.paid)}, Balance: ${this.displayAmount(s.balance)}`); });
            lines.push('');
            lines.push('--- Who Owes Whom ---');
            if (this.transactions.length === 0) { lines.push('All settled up!'); }
            else { this.transactions.forEach(t => { lines.push(`${t.from} owes ${t.to}: ${this.displayAmount(t.amount)}`); }); }
            const text = lines.join('\n');
            const blob = new Blob([text], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const safeName = this.hangout.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.download = `${safeName}_results.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
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
.total-summary { text-align: center; background-color: var(--primary); color: var(--white); }
.total-summary h2 { margin: 0 0 8px; font-weight: 500; }
.total-summary p { margin: 0; font-size: 2.5rem; font-weight: 800; }
.summary-item { padding: 12px; background-color: var(--base); border-radius: 8px; }
.summary-item h3 { margin: 0 0 8px; }
.summary-details { display: flex; flex-direction: column; gap: 4px; }
.summary-details > div { display: flex; justify-content: space-between; }
.text-danger { color: var(--danger); }
.text-success { color: var(--success); }
.transaction-item { display: grid; grid-template-columns: 1fr auto 1fr auto; align-items: center; gap: 12px; padding: 16px; background-color: var(--secondary); color: var(--white); border-radius: 8px; margin-bottom: 8px; font-weight: 600; }
.transaction-item .arrow { font-size: 1.5rem; }
.transaction-item .amount { font-weight: 800; font-size: 1.2rem; text-align: right; }
.settled { text-align: center; padding: 24px; font-size: 1.2rem; font-weight: 600; }
@media (min-width: 768px) { .summaries-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; } }
</style>