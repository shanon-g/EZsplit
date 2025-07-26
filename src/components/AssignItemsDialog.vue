<template>
    <div class="dialog-overlay" @click.self="$emit('close')">
        <div class="dialog-content">
            <div class="dialog-header">
                <h3>Assign Scanned Items</h3>
                <button @click="$emit('close')" class="close-btn">&times;</button>
            </div>
            <div class="items-list">
                <div v-for="item in localItems" :key="item.id" class="scanned-item">
                    <div class="item-details">
                        <span class="item-description">{{ item.description }}</span>
                        <span class="item-total">{{ formatCurrency(item.total, currency) }}</span>
                    </div>
                    <select v-model="item.personId" class="payer-select">
                        <option :value="null">Unassigned</option>
                        <option v-for="person in people" :key="person.id" :value="person.id">
                            {{ person.name }}
                        </option>
                    </select>
                </div>
            </div>
            <button @click="saveAssignments" class="btn-primary" style="width: 100%; margin-top: 16px;">Add Assigned Items</button>
        </div>
    </div>
</template>

<script>
import { formatCurrency, loadCurrency } from '../utils/currency.js';

export default {
    name: 'AssignItemsDialog',
    props: {
        scannedItems: {
            type: Array,
            required: true,
        },
        people: {
            type: Array,
            required: true,
        }
    },
    data() {
        return {
            localItems: [],
            currency: 'IDR'
        };
    },
    created() {
        this.currency = loadCurrency();
        this.localItems = JSON.parse(JSON.stringify(this.scannedItems)).map(item => ({
            ...item,
            personId: null
        }));
    },
    methods: {
        formatCurrency,
        saveAssignments() {
            const assignedItems = this.localItems.filter(item => item.personId);
            this.$emit('save-assignments', assignedItems);
        }
    }
}
</script>

<style scoped>
.items-list {
    max-height: 40vh;
    overflow-y: auto;
    padding-right: 8px;
}
.scanned-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background-color: var(--base);
    border-radius: 8px;
    margin-bottom: 8px;
}
.item-details {
    display: flex;
    justify-content: space-between;
}
.item-description {
    font-weight: 500;
    margin-right: 16px;
}
.item-total {
    font-weight: 700;
    white-space: nowrap;
}
</style>