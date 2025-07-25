<template>
  <div class="calculator">
    <div class="display">{{ current || '0' }}</div>
    <div class="buttons">
      <button @click="clear" class="btn-op">C</button>
      <button @click="sign" class="btn-op">+/-</button>
      <button @click="percent" class="btn-op">%</button>
      <button @click="divide" class="btn-op">÷</button>
      <button @click="append('7')">7</button>
      <button @click="append('8')">8</button>
      <button @click="append('9')">9</button>
      <button @click="multiply" class="btn-op">×</button>
      <button @click="append('4')">4</button>
      <button @click="append('5')">5</button>
      <button @click="append('6')">6</button>
      <button @click="subtract" class="btn-op">-</button>
      <button @click="append('1')">1</button>
      <button @click="append('2')">2</button>
      <button @click="append('3')">3</button>
      <button @click="add" class="btn-op">+</button>
      <button @click="append('0')" class="zero">0</button>
      <button @click="dot">.</button>
      <button @click="equal" class="btn-op">=</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      previous: null,
      current: '',
      operator: null,
      operatorClicked: false,
    };
  },
  methods: {
    clear() {
      this.current = '';
    },
    sign() {
      this.current = this.current.charAt(0) === '-' ? 
        this.current.slice(1) : `-${this.current}`;
    },
    percent() {
      this.current = `${parseFloat(this.current) / 100}`;
    },
    append(number) {
      if (this.operatorClicked) {
        this.current = '';
        this.operatorClicked = false;
      }
      this.current = `${this.current}${number}`;
    },
    dot() {
      if (this.current.indexOf('.') === -1) {
        this.append('.');
      }
    },
    setPrevious() {
      this.previous = this.current;
      this.operatorClicked = true;
    },
    divide() {
      this.operator = (a, b) => a / b;
      this.setPrevious();
    },
    multiply() {
      this.operator = (a, b) => a * b;
      this.setPrevious();
    },
    subtract() {
      this.operator = (a, b) => a - b;
      this.setPrevious();
    },
    add() {
      this.operator = (a, b) => a + b;
      this.setPrevious();
    },
    equal() {
      this.current = `${this.operator(
        parseFloat(this.previous),
        parseFloat(this.current)
      )}`;
      this.previous = null;
    }
  }
};
</script>

<style scoped>
.calculator {
  width: 100%;
  margin: 0 auto;
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
}
.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.buttons button {
  padding: 20px;
  font-size: 1.5rem;
  background-color: var(--secondary);
  color: var(--white);
}
.buttons button:hover {
    filter: brightness(120%);
}
.buttons .btn-op {
  background-color: var(--tertiary);
}
.zero {
  grid-column: 1 / 3;
}
</style>