<template>
  <div v-if="hangout">
    <header class="page-header">
      <router-link :to="{ name: 'hangout', params: { id: hangout.id } }"><button class="btn-back">&lt;</button></router-link>
      <h1>Results</h1>
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
        <div v-if="transactions.length === 0" class="settled"><p>🎉 All settled up!</p></div>
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
    methods: {
        displayAmount(amount) { return formatCurrency(amount, this.currency); },
        loadAndCalculate() {
            const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
            this.hangout = hangouts.find(h => h.id === this.$route.params.id);
            if (this.hangout) { this.calculateSummaries(); this.calculateTransactions(); }
        },
        calculateSummaries() {
            this.summaries = this.hangout.people.map(person => {
                const subtotalSpent = this.hangout.categories.reduce((sum, cat) => sum + cat.items.filter(item => item.personId === person.id).reduce((itemSum, item) => itemSum + item.amount, 0), 0);
                
                const additionalChargesSpent = this.hangout.categories.reduce((sum, cat) => {
                    const participants = [...new Set(cat.items.map(item => item.personId))];
                    if (!participants.includes(person.id)) return sum;
                    
                    let personCharge = 0;
                    const numParticipants = participants.length;
                    
                    if (cat.hasTax && cat.subtotal > 0) {
                        const personSubtotal = cat.items.filter(item => item.personId === person.id).reduce((itemSum, item) => itemSum + item.amount, 0);
                        const totalCharges = cat.totalAmount - cat.subtotal;
                        const otherCharges = (cat.hasService ? cat.serviceCharge : 0) + (cat.hasDelivery ? cat.deliveryCharge : 0);
                        const actualTax = Math.max(0, totalCharges - otherCharges);
                        personCharge += (personSubtotal / cat.subtotal) * actualTax;
                    }

                    if (cat.hasService) personCharge += cat.serviceCharge / numParticipants;
                    if (cat.hasDelivery) personCharge += cat.deliveryCharge / numParticipants;

                    return sum + personCharge;
                }, 0);
                
                const paid = this.hangout.categories
                    .filter(cat => cat.paidBy === person.id)
                    .reduce((sum, cat) => sum + cat.totalAmount, 0);
                
                const totalSpent = subtotalSpent + additionalChargesSpent;
                return { id: person.id, name: person.name, spent: totalSpent, paid, balance: paid - totalSpent };
            });
        },
        calculateTransactions() {
            let balances = JSON.parse(JSON.stringify(this.summaries));
            let debtors = balances.filter(p => p.balance < 0);
            let creditors = balances.filter(p => p.balance > 0);
            let transactions = [];
            debtors.forEach(debtor => {
                while (Math.abs(debtor.balance) > 0.01) {
                    let creditor = creditors.find(c => c.balance > 0.01);
                    if (!creditor) break;
                    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
                    transactions.push({ from: debtor.name, to: creditor.name, amount: amount });
                    debtor.balance += amount;
                    creditor.balance -= amount;
                }
            });
            this.transactions = transactions;
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