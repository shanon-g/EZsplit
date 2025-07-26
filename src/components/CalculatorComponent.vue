<template>
  <div class="calculator">
    <div class="history" v-if="history.length">
      <div v-for="(step, index) in history" :key="index" class="history-step">
        {{ step }}
      </div>
    </div>
    <div class="display">{{ expression || current || '0' }}</div>
    <div class="buttons">
      <button @click="clear" class="btn-op">C</button>
      <button @click="del" class="btn-op">DEL</button>
      <button @click="percent" class="btn-op">%</button>
      <button @click="setOperator('/')" class="btn-op">÷</button>
      <button @click="append('7')">7</button>
      <button @click="append('8')">8</button>
      <button @click="append('9')">9</button>
      <button @click="setOperator('*')" class="btn-op">×</button>
      <button @click="append('4')">4</button>
      <button @click="append('5')">5</button>
      <button @click="append('6')">6</button>
      <button @click="setOperator('-')" class="btn-op">-</button>
      <button @click="append('1')">1</button>
      <button @click="append('2')">2</button>
      <button @click="append('3')">3</button>
      <button @click="setOperator('+')" class="btn-op">+</button>
      <button @click="sign" class="btn-op">+/-</button>
      <button @click="append('0')">0</button>
      <button @click="dot">.</button>
      <button @click="equal" class="btn-op">=</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      current: '',
      previous: null,
      operator: null,
      operatorClicked: false,
      history: [],
      expression: ''
    };
  },
  methods: {
    clear() {
      this.current = '';
      this.previous = null;
      this.operator = null;
      this.history = [];
      this.expression = '';
    },
    sign() {
      this.current = this.current.charAt(0) === '-' ? 
        this.current.slice(1) : `-${this.current}`;
      this.updateExpression();
    },

    del() {
      if (this.current !== '') {
        this.current = this.current.slice(0, -1);
      } else if (this.operator && this.operatorClicked) {
        this.operator = null;
        this.operatorClicked = false;
      } else if (this.operator && this.previous !== null) {
        this.current = this.previous;
        this.previous = null;
        this.operator = null;
      }

      this.updateExpression();
    },

    percent() {
      this.current = `${parseFloat(this.current) / 100}`;
      this.updateExpression();
    },
    append(number) {
      if (this.operatorClicked) {
        this.current = '';
        this.operatorClicked = false;
      }
      this.current = `${this.current}${number}`;
      this.updateExpression();
    },
    dot() {
      if (this.current.indexOf('.') === -1) {
        this.append('.');
      }
    },
    setOperator(op) {
      if (this.current === '') return;
      if (this.previous !== null && this.operator && !this.operatorClicked) {
        this.equal();
      }
      this.operator = op;
      this.previous = this.current;
      this.operatorClicked = true;
      this.expression = `${this.previous} ${this.operator}`;
    },
    equal() {
      if (this.operator === null || this.previous === null) return;
      const prev = parseFloat(this.previous);
      const curr = parseFloat(this.current);
      let result = 0;

      switch (this.operator) {
        case '+': result = prev + curr; break;
        case '-': result = prev - curr; break;
        case '*': result = prev * curr; break;
        case '/': result = prev / curr; break;
      }

      const fullExpression = `${this.previous} ${this.operator} ${this.current} = ${result}`;
      this.history.push(fullExpression);
      this.current = `${result}`;
      this.previous = null;
      this.operator = null;
      this.operatorClicked = false;
      this.expression = '';
    },
    updateExpression() {
      if (this.operator && this.previous !== null) {
        this.expression = `${this.previous} ${this.operator} ${this.current}`;
      } else {
        this.expression = this.current;
      }
    }
  }
};
</script>

<style scoped>
.calculator {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  font-family: 'Segoe UI', sans-serif;
}
.display {
  background-color: var(--base);
  color: var(--primary);
  font-size: 2.5rem;
  padding: 20px;
  text-align: right;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 700;
  min-height: 60px;
}
.history {
  background-color: #f6f6f6;
  padding: 10px;
  font-size: 0.9rem;
  margin-bottom: 10px;
  border-radius: 8px;
  color: #444;
  max-height: 70px;
  overflow-y: auto;
}
.history-step {
  margin-bottom: 4px;
}
.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.buttons button {
  padding: 14px;
  font-size: 1.5rem;
  background-color: var(--secondary);
  color: var(--white);
  border-radius: 8px;
  border: none;
}
.buttons button:hover {
  filter: brightness(120%);
  cursor: pointer;
}
.buttons .btn-op {
  background-color: var(--tertiary);
}

</style>