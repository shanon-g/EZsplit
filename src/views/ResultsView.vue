<template>
  <div v-if="hangout">
    <header class="page-header">
      <router-link :to="{ name: 'hangout', params: { id: hangout.id } }"><button class="btn-back">&lt;</button></router-link>
      <h1>Results</h1>
    </header>

    <div class="page-content">
      <div class="card total-summary">
        <h2>Total Bill</h2>
        <p>\${{ totalBill.toFixed(2) }}</p>
      </div>

      <div class="card">
        <h2>Individual Summary</h2>
        <div class="summaries-grid">
            <div v-for="summary in summaries" :key="summary.id" class="summary-item">
                <h3>{{ summary.name }}</h3>
                <div class="summary-details">
                    <div><span>Spent:</span> \${{ summary.spent.toFixed(2) }}</div>
                    <div><span>Paid:</span> \${{ summary.paid.toFixed(2) }}</div>
                    <div>
                        <span>Balance:</span>
                        <span :class="{'text-success': summary.balance >= 0, 'text-danger': summary.balance < 0}">
                            \${{ summary.balance.toFixed(2) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
      </div>

      <div class="card">
        <h2>Who Owes Whom</h2>
        <div v-if="transactions.length === 0" class="settled">
            <p>🎉 All settled up!</p>
        </div>
        <div v-else>
            <div v-for="(t, index) in transactions" :key="index" class="transaction-item">
                <span>{{ t.from }}</span>
                <span class="arrow">&rarr;</span>
                <span>{{ t.to }}</span>
                <span class="amount">\${{ t.amount.toFixed(2) }}</span>
            </div>
        </div>
      </div>
      <button @click="saveAsText" class="btn-secondary" style="width: 100%; margin-top: 16px;">Save as Text</button>
    </div>
  </div>
</template>

<script>
export default {
    data() {
        return {
            hangout: null,
            summaries: [],
            transactions: [],
        }
    },
    computed: {
        totalBill() {
            if (!this.hangout) return 0;
            return this.hangout.categories.reduce((sum, cat) => sum + cat.totalAmount, 0);
        }
    },
    created() {
        this.loadAndCalculate();
    },
    methods: {
        loadAndCalculate() {
            const hangouts = JSON.parse(localStorage.getItem('split_bill_hangouts') || '[]');
            this.hangout = hangouts.find(h => h.id === this.$route.params.id);
            if (this.hangout) {
                this.calculateSummaries();
                this.calculateTransactions();
            }
        },
        calculateSummaries() {
            this.summaries = this.hangout.people.map(person => {
                const spent = this.hangout.categories.reduce((sum, cat) => {
                    return sum + cat.items
                        .filter(item => item.personId === person.id)
                        .reduce((itemSum, item) => itemSum + item.amount, 0);
                }, 0);

                const paid = this.hangout.categories
                    .filter(cat => cat.paidBy === person.id)
                    .reduce((sum, cat) => sum + cat.totalAmount, 0);
                
                return {
                    id: person.id,
                    name: person.name,
                    spent,
                    paid,
                    balance: paid - spent
                };
            });
        },
        calculateTransactions() {
            let balances = JSON.parse(JSON.stringify(this.summaries)); // Deep copy
            let debtors = balances.filter(p => p.balance < 0);
            let creditors = balances.filter(p => p.balance > 0);
            let transactions = [];

            debtors.forEach(debtor => {
                while (Math.abs(debtor.balance) > 0.01) {
                    let creditor = creditors.find(c => c.balance > 0.01);
                    if (!creditor) break;

                    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
                    
                    transactions.push({
                        from: debtor.name,
                        to: creditor.name,
                        amount: amount
                    });

                    debtor.balance += amount;
                    creditor.balance -= amount;
                }
            });
            this.transactions = transactions;
        },
        saveAsText() {
            let text = `Bill Splitting Results for: ${this.hangout.name}\n`;
            text += `Total Bill: $${this.totalBill.toFixed(2)}\n\n`;
            text += "--- Individual Summaries ---\n";
            this.summaries.forEach(s => {
                text += `${s.name} | Spent: $${s.spent.toFixed(2)}, Paid: $${s.paid.toFixed(2)}, Balance: $${s.balance.toFixed(2)}\n`;
            });
            text += "\n--- Who Owes Whom ---\n";
            if (this.transactions.length === 0) {
                text += "All settled up!\n";
            } else {
                this.transactions.forEach(t => {
                    text += `${t.from} owes ${t.to}: $${t.amount.toFixed(2)}\n`;
                });
            }

            const blob = new Blob([text], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${this.hangout.name}_results.txt`;
            link.click();
            URL.revokeObjectURL(link.href);
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
.total-summary {
    text-align: center;
    background-color: var(--primary);
    color: var(--white);
}
.total-summary h2 {
    margin: 0 0 8px;
    font-weight: 500;
}
.total-summary p {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 800;
}
.summary-item {
    padding: 12px;
    background-color: var(--base);
    border-radius: 8px;
    margin-bottom: 8px;
}
.summary-item h3 {
    margin: 0 0 8px;
}
.summary-details {
    display: flex;
    justify-content: space-between;
}
.summary-details span {
    font-weight: 600;
}
.text-danger { color: var(--danger); }
.text-success { color: var(--success); }

.transaction-item {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: var(--secondary);
    color: var(--white);
    border-radius: 8px;
    margin-bottom: 8px;
    font-weight: 600;
}
.transaction-item .arrow {
    font-size: 1.5rem;
}
.transaction-item .amount {
    font-weight: 800;
    font-size: 1.2rem;
    text-align: right;
}
.settled {
    text-align: center;
    padding: 24px;
    font-size: 1.2rem;
    font-weight: 600;
}

@media (min-width: 768px) {
  .summaries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }
}
</style>