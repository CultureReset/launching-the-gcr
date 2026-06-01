// Frontend Integration with AWS Secrets Manager Backend
// Business POS credentials are stored securely in AWS
// YOU (Gulf Coast Radar) NEVER have access to these credentials!

class AWSSecretIntegration {
  constructor() {
    this.apiBaseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api/business'
      : '/api/business'; // Production URL
  }

  /**
   * Save POS credentials securely
   * Credentials are sent to backend → encrypted → stored in AWS
   * You NEVER see the credentials!
   *
   * @param {string} businessId - Business identifier
   * @param {string} posSystem - 'toast', 'square', or 'spoton'
   * @param {Object} credentials - POS API credentials
   * @returns {Promise<boolean>} Success status
   */
  async savePOSCredentials(businessId, posSystem, credentials) {
    try {
      console.log(`🔒 Saving ${posSystem} credentials for business: ${businessId}`);
      console.log('   Credentials will be encrypted and stored in AWS Secrets Manager');
      console.log('   Gulf Coast Radar will NOT have access to these credentials');

      const response = await fetch(`${this.apiBaseUrl}/save-pos-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: businessId,
          posSystem: posSystem,
          posCredentials: credentials
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Credentials saved successfully to AWS Secrets Manager');
        return true;
      } else {
        console.error('❌ Failed to save credentials:', result.error);
        return false;
      }

    } catch (error) {
      console.error('❌ Error saving credentials:', error);
      return false;
    }
  }

  /**
   * Send order to POS
   * Backend retrieves credentials from AWS, sends order, then discards credentials
   * Credentials NEVER sent to client
   *
   * @param {string} businessId - Business identifier
   * @param {Object} order - Order details
   * @returns {Promise<Object>} Order result
   */
  async sendOrderToPOS(businessId, order) {
    try {
      console.log(`📦 Sending order to POS for business: ${businessId}`);
      console.log(`   Order ID: ${order.orderId}`);

      const response = await fetch(`${this.apiBaseUrl}/send-order-to-pos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: businessId,
          order: order
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Order sent to POS successfully');
        console.log(`   POS Order ID: ${result.posOrderId}`);
      } else {
        console.error('❌ Failed to send order to POS:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ Error sending order to POS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect POS integration
   * Deletes credentials from AWS Secrets Manager
   *
   * @param {string} businessId - Business identifier
   * @returns {Promise<boolean>} Success status
   */
  async disconnectPOS(businessId) {
    try {
      console.log(`🗑️  Disconnecting POS for business: ${businessId}`);

      const response = await fetch(`${this.apiBaseUrl}/disconnect-pos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: businessId
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ POS credentials deleted from AWS');
        return true;
      } else {
        console.error('❌ Failed to delete credentials:', result.error);
        return false;
      }

    } catch (error) {
      console.error('❌ Error disconnecting POS:', error);
      return false;
    }
  }

  /**
   * Check if business has POS credentials configured
   *
   * @param {string} businessId - Business identifier
   * @returns {Promise<boolean>} True if credentials exist
   */
  async hasCredentials(businessId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/has-pos-credentials/${businessId}`);
      const result = await response.json();

      return result.hasCredentials || false;

    } catch (error) {
      console.error('❌ Error checking credentials:', error);
      return false;
    }
  }

  /**
   * Get POS integration metadata (NOT the actual credentials)
   * Shows last updated date, etc.
   *
   * @param {string} businessId - Business identifier
   * @returns {Promise<Object|null>} Metadata or null
   */
  async getMetadata(businessId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/pos-metadata/${businessId}`);
      const result = await response.json();

      if (result.success) {
        return result.metadata;
      } else {
        return null;
      }

    } catch (error) {
      console.error('❌ Error fetching metadata:', error);
      return null;
    }
  }

  /**
   * Check if backend is healthy and can connect to AWS
   *
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/secrets-health`);
      const result = await response.json();

      if (result.success) {
        console.log('✅ Backend and AWS Secrets Manager connection OK');
        console.log(`   AWS Region: ${result.region}`);
        return true;
      } else {
        console.error('❌ Backend health check failed:', result.error);
        return false;
      }

    } catch (error) {
      console.error('❌ Cannot connect to backend:', error);
      return false;
    }
  }
}

// Create global instance
window.awsSecretIntegration = new AWSSecretIntegration();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AWSSecretIntegration;
}
