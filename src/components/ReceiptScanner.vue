<template>
  <div>
    <input type="file" @change="handleImageUpload" accept="image/*" ref="fileInput" style="display: none;" />
    <button @click="triggerFileInput" class="btn-secondary" style="width:100%; margin-top: 8px; background-color: var(--tertiary);" :disabled="isLoading">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
      <span v-if="!isLoading">Scan Receipt</span>
      <span v-else>{{ status }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'ReceiptScanner',
  data() {
    return {
      isLoading: false,
      status: 'Initializing...',
      apiKey: process.env.VUE_APP_MINDEE_API_KEY, 
    };
  },
  methods: {
    triggerFileInput() {
      if (!this.apiKey || this.apiKey === "undefined") {
          alert("Configuration Error: Mindee API key is not set. Please check your .env.local file or Vercel environment variables.");
          return;
      }
      this.$refs.fileInput.click();
    },
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.isLoading = true;
      this.status = 'Uploading & Processing...';

      const formData = new FormData();
      formData.append('document', file);

      try {
        const response = await fetch("POST https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict", {
          method: "POST",
          headers: {
            "Authorization": `Token ${this.apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.api_request.error.message);
        }

        const result = await response.json();
        const receipt = result.document.inference.prediction;

        const parsedData = {
            items: receipt.line_items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                total: item.total_amount,
                id: Math.random().toString(36).substring(2, 9) 
            })),
            total: receipt.total_amount.value || 0,
            tax: receipt.total_tax.value || 0,
        };
        
        this.$emit('scan-complete', parsedData);

      } catch (error) {
        console.error('OCR Error:', error);
        alert(`Could not process the receipt: ${error.message}`);
      } finally {
        this.isLoading = false;
        event.target.value = null;
      }
    },
  }
};
</script>