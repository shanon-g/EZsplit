<template>
  <div id="main-app-container">
    <router-view/>
    
    <!-- Floating Calculator Button -->
    <button @click="showCalculator = true" class="fab">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="8" y2="14"></line><line x1="16" y1="18" x2="8" y2="18"></line><line x1="10" y1="10" x2="14" y2="10"></line></svg>
    </button>

    <!-- Ad Banner -->
    <div class="ad-banner">
      <p>by shn</p>
    </div>

    <!-- Calculator Dialog -->
    <div v-if="showCalculator" class="dialog-overlay" @click.self="showCalculator = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Calculator</h3>
          <button @click="showCalculator = false" class="close-btn">&times;</button>
        </div>
        <CalculatorComponent />
      </div>
    </div>
  </div>
</template>

<script>
import CalculatorComponent from './components/CalculatorComponent.vue';

export default {
  name: 'App',
  components: {
    CalculatorComponent
  },
  data() {
    return {
      showCalculator: false,
    };
  },
};
</script>

<style>
/* Global Styles */
:root {
  --base: #D0CDDD;
  --primary: #0B132B;
  --secondary: #1C2541;
  --tertiary: #3A506B;
  --white: #FFFFFF;
  --danger: #e53e3e;
  --success: #38a169;
}

body {
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  background-color: var(--base);
  color: var(--primary);
  padding-bottom: 90px;
}

#main-app-container {
  max-width: 500px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: var(--base);
}

/* Responsive Container */
@media (min-width: 768px) {
  #main-app-container {
    max-width: 2600px;
  }
}

/* Common Styles */
button, .btn {
  font-family: 'Montserrat', sans-serif;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-primary { background-color: var(--primary); color: var(--white); }
.btn-primary:hover { background-color: var(--secondary); }
.btn-secondary { background-color: var(--tertiary); color: var(--white); }
.btn-danger { background-color: var(--danger); color: var(--white); }

.btn-icon {
  background: none;
  border: none;
  color: var(--white);
  padding: 8px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

input[type="text"], input[type="number"], .payer-select {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--tertiary);
  box-sizing: border-box;
  font-size: 16px; /* Prevents iOS zoom */
  background-color: var(--white);
}

.card {
  background-color: var(--white);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.page-header {
  background-color: var(--primary);
  color: var(--white);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.page-header h1 { margin: 0; font-size: 1.5rem; }

.page-content { padding: 16px; }

/* Dialog/Modal Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
}
.dialog-content {
  background: var(--white);
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.dialog-header h3 { margin: 0; }
.close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--tertiary); }

/* FAB and Ad Banner */
.fab {
  position: fixed;
  bottom: 70px; /* Above the ad banner */
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--primary);
  color: var(--white);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 999;
}

.ad-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: var(--tertiary);
  color: var(--white);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 998;
}
</style>